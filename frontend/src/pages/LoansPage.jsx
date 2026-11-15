import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Select from '../components/Select.jsx'
import { bookApi, loanApi, memberApi } from '../lib/api.js'
import { formatDate, formatRupiah, todayISO } from '../lib/format.js'

export default function LoansPage() {
  const [members, setMembers] = useState([])
  const [books, setBooks] = useState([])
  const [activeLoans, setActiveLoans] = useState([])
  const [form, setForm] = useState({ memberId: '', bookId: '', loanDate: todayISO() })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [memberData, bookData, loanData] = await Promise.all([
        memberApi.list(),
        bookApi.list(),
        loanApi.list(true),
      ])
      setMembers(memberData)
      setBooks(bookData)
      setActiveLoans(loanData)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const selectedMember = useMemo(
    () => members.find((member) => member.id === form.memberId),
    [members, form.memberId],
  )

  const memberOptions = useMemo(() => members.map((member) => ({
    value: member.id,
    label: member.name,
    hint: `${member.categoryLabel} · ${member.activeLoanCount}/${member.loanQuota} dipinjam`,
    meta: member.id,
  })), [members])

  const bookOptions = useMemo(() => books
    .filter((book) => book.available)
    .map((book) => ({
      value: book.id,
      label: book.title,
      hint: book.author,
      meta: `stok ${book.stock}`,
    })), [books])

  const predictedDueDate = useMemo(() => {
    if (!selectedMember || !form.loanDate) return null
    const base = new Date(`${form.loanDate}T00:00:00`)
    if (Number.isNaN(base.getTime())) return null
    base.setDate(base.getDate() + selectedMember.loanPeriodDays)
    // Format tanggal lokal (bukan toISOString/UTC) agar tidak bergeser satu hari.
    const year = base.getFullYear()
    const month = String(base.getMonth() + 1).padStart(2, '0')
    const day = String(base.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [selectedMember, form.loanDate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const loan = await loanApi.borrow({
        memberId: form.memberId,
        bookId: form.bookId,
        loanDate: form.loanDate || null,
      })
      setNotice(
        `Peminjaman ${loan.id} berhasil dicatat. Jatuh tempo ${formatDate(loan.dueDate)} `
        + `(${loan.loanPeriodDays} hari untuk kategori ${loan.memberCategory}).`,
      )
      setForm({ memberId: '', bookId: '', loanDate: todayISO() })
      await loadAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Transaksi Peminjaman"
        description="Mencatat peminjaman buku dengan validasi identitas anggota, ketersediaan stok, dan batas kuota berdasarkan kategori anggota."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Formulir Peminjaman Buku</h2>
        </div>
        <div className="card__body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="loan-member">Anggota Peminjam</label>
                <Select
                  id="loan-member"
                  value={form.memberId}
                  onChange={(value) => setForm((current) => ({ ...current, memberId: value }))}
                  options={memberOptions}
                  placeholder="Pilih anggota…"
                  searchable
                  searchPlaceholder="Cari nama atau ID anggota…"
                  ariaLabel="Anggota peminjam"
                  emptyText="Anggota tidak ditemukan"
                />
                {selectedMember ? (
                  <span className="field__hint">
                    Sisa kuota: {selectedMember.remainingQuota} buku · Durasi pinjam{' '}
                    {selectedMember.loanPeriodDays} hari · Denda {formatRupiah(selectedMember.fineRatePerDay)}/hari
                  </span>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="loan-book">Buku yang Dipinjam</label>
                <Select
                  id="loan-book"
                  value={form.bookId}
                  onChange={(value) => setForm((current) => ({ ...current, bookId: value }))}
                  options={bookOptions}
                  placeholder="Pilih buku…"
                  searchable
                  searchPlaceholder="Cari judul, penulis, atau ID buku…"
                  ariaLabel="Buku yang dipinjam"
                  emptyText="Tidak ada buku tersedia"
                />
                <span className="field__hint">
                  Hanya buku dengan stok tersedia yang dapat dipinjam ({bookOptions.length} judul).
                </span>
              </div>

              <div className="field">
                <label htmlFor="loan-date">Tanggal Peminjaman</label>
                <input
                  id="loan-date"
                  name="loanDate"
                  type="date"
                  value={form.loanDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="loan-due">Jatuh Tempo (otomatis)</label>
                <input
                  id="loan-due"
                  value={predictedDueDate ? formatDate(predictedDueDate) : '—'}
                  readOnly
                  disabled
                />
                <span className="field__hint">Ditentukan sistem dari kategori anggota.</span>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Memproses…' : 'Catat Peminjaman'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Peminjaman Aktif</h2>
          <span className="card__meta">{activeLoans.length} transaksi berjalan</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Anggota</th>
                <th>Buku</th>
                <th>Tanggal Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => {
                const overdue = new Date(`${loan.dueDate}T00:00:00`) < new Date(`${todayISO()}T00:00:00`)
                return (
                  <tr key={loan.id}>
                    <td className="mono">{loan.id}</td>
                    <td>
                      {loan.memberName}
                      <div className="muted" style={{ fontSize: '11.5px' }}>{loan.memberCategory}</div>
                    </td>
                    <td>
                      {loan.bookTitle}
                      <div className="muted mono" style={{ fontSize: '11.5px' }}>{loan.bookId}</div>
                    </td>
                    <td>{formatDate(loan.loanDate)}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td><StatusBadge status={loan.status} late={overdue} /></td>
                  </tr>
                )
              })}
              {activeLoans.length === 0 ? (
                <tr><td colSpan="6" className="empty">Tidak ada peminjaman aktif.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
