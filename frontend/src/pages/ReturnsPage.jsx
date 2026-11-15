import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import Select from '../components/Select.jsx'
import { loanApi } from '../lib/api.js'
import { formatDate, formatRupiah, todayISO } from '../lib/format.js'

function lateDaysBetween(dueDate, returnDate) {
  if (!dueDate || !returnDate) return 0
  const due = new Date(`${dueDate}T00:00:00`)
  const back = new Date(`${returnDate}T00:00:00`)
  if (Number.isNaN(due.getTime()) || Number.isNaN(back.getTime())) return 0
  const diff = Math.round((back - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function ReturnsPage() {
  const [activeLoans, setActiveLoans] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [returnDate, setReturnDate] = useState(todayISO())
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const loadActive = useCallback(async () => {
    try {
      const data = await loanApi.list(true)
      setActiveLoans(data)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    loadActive()
  }, [loadActive])

  const loanOptions = useMemo(() => activeLoans.map((loan) => ({
    value: loan.id,
    label: `${loan.memberName} — ${loan.bookTitle}`,
    hint: loan.id,
    meta: formatDate(loan.dueDate),
  })), [activeLoans])

  const selected = activeLoans.find((loan) => loan.id === selectedId) || null
  const previewLateDays = selected ? lateDaysBetween(selected.dueDate, returnDate) : 0
  const previewFine = selected ? previewLateDays * selected.fineRatePerDay : 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)
    try {
      const loan = await loanApi.giveBack(selectedId, returnDate || null)
      setResult(loan)
      setSelectedId('')
      setReturnDate(todayISO())
      await loadActive()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Transaksi Pengembalian"
        description="Mencatat pengembalian buku berdasarkan transaksi peminjaman, menghitung keterlambatan dan denda secara otomatis, serta memperbarui stok buku."
      />

      <Alert type="error">{error}</Alert>
      {result ? (
        <Alert type="success">
          Pengembalian transaksi <strong>{result.id}</strong> berhasil dicatat pada{' '}
          {formatDate(result.returnDate)}. Keterlambatan {result.lateDays} hari, denda{' '}
          <strong>{formatRupiah(result.fine)}</strong>. Stok buku {result.bookTitle} sudah diperbarui.
        </Alert>
      ) : null}

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Formulir Pengembalian Buku</h2>
        </div>
        <div className="card__body">
          {activeLoans.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Tidak ada transaksi peminjaman aktif yang dapat dikembalikan.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="return-loan">Transaksi Peminjaman</label>
                  <Select
                    id="return-loan"
                    value={selectedId}
                    onChange={setSelectedId}
                    options={loanOptions}
                    placeholder="Pilih transaksi…"
                    searchable
                    searchPlaceholder="Cari ID transaksi, anggota, atau buku…"
                    ariaLabel="Transaksi peminjaman"
                    emptyText="Transaksi tidak ditemukan"
                  />
                </div>

                <div className="field">
                  <label htmlFor="return-date">Tanggal Pengembalian</label>
                  <input
                    id="return-date"
                    type="date"
                    value={returnDate}
                    onChange={(event) => setReturnDate(event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="return-due">Jatuh Tempo</label>
                  <input id="return-due" value={selected ? formatDate(selected.dueDate) : '—'} readOnly disabled />
                </div>

                <div className="field">
                  <label htmlFor="return-fine">Perkiraan Denda</label>
                  <input
                    id="return-fine"
                    value={selected ? `${formatRupiah(previewFine)} (${previewLateDays} hari terlambat)` : '—'}
                    readOnly
                    disabled
                  />
                  {selected ? (
                    <span className="field__hint">
                      Tarif {selected.memberCategory}: {formatRupiah(selected.fineRatePerDay)} per hari.
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn--primary" disabled={!selectedId}>
                  Catat Pengembalian
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Daftar Buku Belum Dikembalikan ({activeLoans.length})</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Anggota</th>
                <th>Kategori</th>
                <th>Buku</th>
                <th>Tanggal Pinjam</th>
                <th>Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="mono">{loan.id}</td>
                  <td>{loan.memberName}</td>
                  <td>{loan.memberCategory}</td>
                  <td>{loan.bookTitle}</td>
                  <td>{formatDate(loan.loanDate)}</td>
                  <td>{formatDate(loan.dueDate)}</td>
                </tr>
              ))}
              {activeLoans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty">Semua buku sudah dikembalikan.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
