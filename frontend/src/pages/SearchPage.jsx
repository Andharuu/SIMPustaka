import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import { bookApi, memberApi } from '../lib/api.js'
import { formatDate, formatRupiah } from '../lib/format.js'

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [books, setBooks] = useState(null)
  const [members, setMembers] = useState(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const query = keyword.trim()
    try {
      const [bookResult, memberResult] = await Promise.all([
        bookApi.list(query),
        memberApi.list(query),
      ])
      setBooks(bookResult)
      setMembers(memberResult)
      setSearched(true)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Pencarian Data"
        description="Mencari data buku berdasarkan judul atau identitas buku serta mencari anggota berdasarkan identitas anggota."
      />

      <Alert type="error">{error}</Alert>

      <section className="card">
        <div className="card__body">
          <form className="toolbar" onSubmit={handleSubmit}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Kata kunci: judul buku, ID, penulis, nama anggota, NIM/NIP..."
              aria-label="Kata kunci pencarian"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn--primary">Cari</button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => { setKeyword(''); setBooks(null); setMembers(null); setSearched(false) }}
            >
              Bersihkan
            </button>
          </form>
        </div>
      </section>

      <div className="split">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Hasil Pencarian Buku {books ? `(${books.length})` : ''}</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Judul</th>
                  <th>Penulis</th>
                  <th>Stok</th>
                </tr>
              </thead>
              <tbody>
                {(books || []).map((book) => (
                  <tr key={book.id}>
                    <td className="mono">{book.id}</td>
                    <td>
                      {book.title}
                      <div className="muted" style={{ fontSize: '12px' }}>{book.category}</div>
                    </td>
                    <td>{book.author}</td>
                    <td>
                      <span className={`badge ${book.available ? 'badge--success' : 'badge--danger'}`}>
                        {book.stock}
                      </span>
                    </td>
                  </tr>
                ))}
                {books && books.length === 0 ? (
                  <tr><td colSpan="4" className="empty">Tidak ada buku yang sesuai.</td></tr>
                ) : null}
                {!books ? (
                  <tr><td colSpan="4" className="empty">Masukkan kata kunci lalu tekan Cari.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Hasil Pencarian Anggota {members ? `(${members.length})` : ''}</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Identitas</th>
                  <th>Kategori</th>
                </tr>
              </thead>
              <tbody>
                {(members || []).map((member) => (
                  <tr key={member.id}>
                    <td className="mono">{member.id}</td>
                    <td>{member.name}</td>
                    <td className="mono">{member.identityNumber}</td>
                    <td>
                      <span className="badge badge--info">{member.categoryLabel}</span>
                      <div className="muted" style={{ fontSize: '12px' }}>
                        {member.activeLoanCount}/{member.loanQuota} · {member.loanPeriodDays} hari ·{' '}
                        {formatRupiah(member.fineRatePerDay)}/hari
                      </div>
                    </td>
                  </tr>
                ))}
                {members && members.length === 0 ? (
                  <tr><td colSpan="4" className="empty">Tidak ada anggota yang sesuai.</td></tr>
                ) : null}
                {!members ? (
                  <tr><td colSpan="4" className="empty">Masukkan kata kunci lalu tekan Cari.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {searched ? (
        <p className="muted" style={{ fontSize: '12.5px', margin: 0 }}>
          Pencarian dijalankan pada {formatDate(new Date().toISOString().slice(0, 10))}.
        </p>
      ) : null}
    </>
  )
}
