import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SortHeader from '../components/SortHeader.jsx'
import Select from '../components/Select.jsx'
import { loanApi } from '../lib/api.js'
import { formatDate, formatRupiah, todayISO } from '../lib/format.js'
import { useSortable } from '../lib/sort.js'

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Semua transaksi' },
  { value: 'ACTIVE', label: 'Masih dipinjam' },
  { value: 'RETURNED', label: 'Sudah dikembalikan' },
  { value: 'LATE', label: 'Terlambat' },
]

const COLUMNS = [
  { key: 'id', get: (loan) => loan.id, type: 'text' },
  { key: 'member', get: (loan) => loan.memberName, type: 'text' },
  { key: 'category', get: (loan) => loan.memberCategory, type: 'text' },
  { key: 'book', get: (loan) => loan.bookTitle, type: 'text' },
  { key: 'loanDate', get: (loan) => loan.loanDate, type: 'date' },
  { key: 'dueDate', get: (loan) => loan.dueDate, type: 'date' },
  { key: 'returnDate', get: (loan) => loan.returnDate, type: 'date' },
  { key: 'late', get: (loan) => loan.lateDays, type: 'number' },
  { key: 'fine', get: (loan) => loan.fine, type: 'number' },
]

/** Selisih hari keterlambatan terhadap tanggal jatuh tempo (0 bila belum lewat). */
function daysLate(dueDate, referenceDate) {
  const due = new Date(`${dueDate}T00:00:00`)
  const ref = new Date(`${referenceDate}T00:00:00`)
  if (Number.isNaN(due.getTime()) || Number.isNaN(ref.getTime())) return 0
  const diff = Math.round((ref - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function HistoryPage() {
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await loanApi.list()
      setLoans(data)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Hari & denda terlambat: final bila sudah dikembalikan, perkiraan bila masih berjalan. */
  const lateInfo = (loan) => {
    if (!loan.active) {
      return { days: loan.lateDays, fine: loan.fine, projected: false }
    }
    const days = daysLate(loan.dueDate, todayISO())
    return { days, fine: days * loan.fineRatePerDay, projected: days > 0 }
  }

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase()
    const today = todayISO()
    // Pinjaman yang masih berjalan tetapi sudah lewat jatuh tempo juga terlambat,
    // walaupun denda belum final sampai buku dikembalikan.
    const isLate = (loan) => loan.lateDays > 0 || (loan.active && loan.dueDate < today)
    return loans.filter((loan) => {
      if (filter === 'ACTIVE' && !loan.active) return false
      if (filter === 'RETURNED' && loan.active) return false
      if (filter === 'LATE' && !isLate(loan)) return false
      if (!needle) return true
      return [loan.id, loan.memberId, loan.memberName, loan.bookId, loan.bookTitle]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    })
  }, [loans, filter, keyword])

  const { sorted, sort, toggle } = useSortable(filtered, COLUMNS, 'loanDate', 'desc')

  const totalFine = filtered.reduce((sum, loan) => sum + (loan.fine || 0), 0)

  return (
    <>
      <PageHeader
        title="Riwayat Transaksi"
        description="Menyimpan dan menampilkan riwayat transaksi peminjaman serta pengembalian buku untuk keperluan penelusuran data."
      />

      <Alert type="error">{error}</Alert>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Riwayat ({filtered.length} transaksi)</h2>
          <div className="toolbar">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Telusuri ID transaksi, anggota, atau buku..."
              aria-label="Penelusuran transaksi"
            />
            <Select
              value={filter}
              onChange={setFilter}
              options={FILTER_OPTIONS}
              ariaLabel="Filter transaksi"
            />
            <button type="button" className="btn btn--ghost btn--sm" onClick={load}>Muat Ulang</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortHeader label="ID Transaksi" sortKey="id" sort={sort} onToggle={toggle} />
                <SortHeader label="Anggota" sortKey="member" sort={sort} onToggle={toggle} />
                <SortHeader label="Kategori" sortKey="category" sort={sort} onToggle={toggle} />
                <SortHeader label="Buku" sortKey="book" sort={sort} onToggle={toggle} />
                <SortHeader label="Tgl Pinjam" sortKey="loanDate" sort={sort} onToggle={toggle} />
                <SortHeader label="Jatuh Tempo" sortKey="dueDate" sort={sort} onToggle={toggle} />
                <SortHeader label="Tgl Kembali" sortKey="returnDate" sort={sort} onToggle={toggle} />
                <SortHeader label="Terlambat" sortKey="late" sort={sort} onToggle={toggle} />
                <SortHeader label="Denda" sortKey="fine" sort={sort} onToggle={toggle} />
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((loan) => (
                <tr key={loan.id}>
                  <td className="mono">{loan.id}</td>
                  <td>
                    {loan.memberName}
                    <div className="muted mono" style={{ fontSize: '12px' }}>{loan.memberId}</div>
                  </td>
                  <td>{loan.memberCategory}</td>
                  <td>
                    {loan.bookTitle}
                    <div className="muted mono" style={{ fontSize: '12px' }}>{loan.bookId}</div>
                  </td>
                  <td>{formatDate(loan.loanDate)}</td>
                  <td>{formatDate(loan.dueDate)}</td>
                  <td>{formatDate(loan.returnDate)}</td>
                  <td>
                    {lateInfo(loan).days > 0
                      ? `${lateInfo(loan).days} hari${lateInfo(loan).projected ? ' *' : ''}`
                      : '-'}
                  </td>
                  <td
                    title={lateInfo(loan).projected
                      ? 'Perkiraan denda berjalan; nilai final dihitung saat buku dikembalikan'
                      : undefined}
                  >
                    {lateInfo(loan).projected
                      ? <span className="muted">≈ {formatRupiah(lateInfo(loan).fine)}</span>
                      : (loan.fine > 0 ? formatRupiah(loan.fine) : '-')}
                  </td>
                  <td>
                    <StatusBadge
                      status={loan.status}
                      late={loan.active && loan.dueDate < todayISO()}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty">Belum ada transaksi yang cocok dengan filter.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="card__header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
          <span className="card__title">Total denda pada daftar ini</span>
          <strong>{formatRupiah(totalFine)}</strong>
        </div>
      </section>
    </>
  )
}
