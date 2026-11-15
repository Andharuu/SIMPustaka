import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import BookCard from '../components/BookCard.jsx'
import SortHeader from '../components/SortHeader.jsx'
import ViewToggle from '../components/ViewToggle.jsx'
import Select from '../components/Select.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { bookApi } from '../lib/api.js'
import { useSortable } from '../lib/sort.js'

const EMPTY_FORM = { id: '', title: '', author: '', category: '', stock: '1' }

// Definisi kolom sekaligus aksesor untuk pengurutan.
const COLUMNS = [
  { key: 'id', get: (book) => book.id, type: 'text' },
  { key: 'title', get: (book) => book.title, type: 'text' },
  { key: 'author', get: (book) => book.author, type: 'text' },
  { key: 'category', get: (book) => book.category, type: 'text' },
  { key: 'stock', get: (book) => book.stock, type: 'number' },
  { key: 'available', get: (book) => (book.available ? 1 : 0), type: 'number' },
]

const SORT_OPTIONS = [
  { value: 'title', label: 'Judul (A–Z)' },
  { value: 'author', label: 'Penulis (A–Z)' },
  { value: 'category', label: 'Kategori (A–Z)' },
  { value: 'stock', label: 'Stok terbanyak' },
  { value: 'id', label: 'ID buku' },
]

const VIEW_STORAGE_KEY = 'simpustaka.books.view'

export default function BooksPage() {
  const [searchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState(() => localStorage.getItem(VIEW_STORAGE_KEY) || 'table')

  const loadBooks = useCallback(async (search = '') => {
    setLoading(true)
    try {
      const data = await bookApi.list(search)
      setBooks(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Kata kunci dari kotak pencarian global (?q=) langsung dipakai.
  useEffect(() => {
    const fromUrl = searchParams.get('q') || ''
    setKeyword(fromUrl)
    loadBooks(fromUrl)
  }, [searchParams, loadBooks])

  const { sorted, sort, toggle } = useSortable(books, COLUMNS, 'id', 'asc')

  const changeView = (next) => {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const payload = {
      id: form.id.trim(),
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      stock: Number(form.stock),
    }
    try {
      if (editing) {
        await bookApi.update(editing, payload)
        setNotice(`Data buku "${payload.title}" berhasil diperbarui.`)
      } else {
        await bookApi.create(payload)
        setNotice(`Buku "${payload.title}" berhasil ditambahkan.`)
      }
      resetForm()
      await loadBooks(keyword)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEdit = (book) => {
    setEditing(book.id)
    setForm({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      stock: String(book.stock),
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`Hapus buku "${book.title}" (${book.id}) dari koleksi?`)) return
    setError('')
    setNotice('')
    try {
      await bookApi.remove(book.id)
      setNotice(`Buku "${book.title}" berhasil dihapus.`)
      if (editing === book.id) resetForm()
      await loadBooks(keyword)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadBooks(keyword.trim())
  }

  const summary = useMemo(() => {
    const tersedia = sorted.filter((book) => book.available).length
    return { total: sorted.length, tersedia, habis: sorted.length - tersedia }
  }, [sorted])

  return (
    <>
      <PageHeader
        title="Pengelolaan Data Buku"
        description="Menambahkan, menampilkan, mengubah, dan menghapus data buku beserta informasi stok dan ketersediaannya."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">{editing ? `Ubah Buku: ${editing}` : 'Tambah Buku Baru'}</h2>
          {editing ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetForm}>
              Batal Ubah
            </button>
          ) : null}
        </div>
        <div className="card__body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="book-id">ID Buku</label>
                <input
                  id="book-id"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  placeholder="B-001"
                  disabled={Boolean(editing)}
                  required
                />
                <span className="field__hint">ID buku tidak dapat diubah setelah tersimpan.</span>
              </div>
              <div className="field">
                <label htmlFor="book-title">Judul</label>
                <input id="book-title" name="title" value={form.title} onChange={handleChange} placeholder="Struktur Data" required />
              </div>
              <div className="field">
                <label htmlFor="book-author">Penulis</label>
                <input id="book-author" name="author" value={form.author} onChange={handleChange} placeholder="Rosa A. S." required />
              </div>
              <div className="field">
                <label htmlFor="book-category">Kategori</label>
                <input id="book-category" name="category" value={form.category} onChange={handleChange} placeholder="Informatika" required />
              </div>
              <div className="field">
                <label htmlFor="book-stock">Stok</label>
                <input id="book-stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
                <span className="field__hint">Stok 0 berarti buku tidak tersedia.</span>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary">
                {editing ? 'Simpan Perubahan' : 'Tambah Buku'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card__header card__header--stack">
          <div className="card__heading">
            <h2 className="card__title">Daftar Koleksi Buku</h2>
            <span className="card__meta">
              {summary.total} judul · {summary.tersedia} tersedia · {summary.habis} habis
            </span>
          </div>

          <div className="toolbar toolbar--wrap">
            <form className="toolbar" onSubmit={handleSearch}>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Cari judul, ID, penulis, atau kategori…"
                aria-label="Pencarian buku"
              />
              <button type="submit" className="btn btn--ghost btn--sm">Cari</button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => { setKeyword(''); loadBooks('') }}
              >
                Reset
              </button>
            </form>
            <ViewToggle value={view} onChange={changeView} />
          </div>
        </div>

        {view === 'table' ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <SortHeader label="ID" sortKey="id" sort={sort} onToggle={toggle} />
                  <SortHeader label="Judul" sortKey="title" sort={sort} onToggle={toggle} />
                  <SortHeader label="Penulis" sortKey="author" sort={sort} onToggle={toggle} />
                  <SortHeader label="Kategori" sortKey="category" sort={sort} onToggle={toggle} />
                  <SortHeader label="Stok" sortKey="stock" sort={sort} onToggle={toggle} />
                  <SortHeader label="Ketersediaan" sortKey="available" sort={sort} onToggle={toggle} />
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((book) => (
                  <tr key={book.id}>
                    <td className="mono">{book.id}</td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td><span className="chip">{book.category}</span></td>
                    <td>{book.stock}</td>
                    <td>
                      <span className={`badge ${book.available ? 'badge--success' : 'badge--danger'}`}>
                        {book.available ? 'Tersedia' : 'Habis'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleEdit(book)}>Ubah</button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(book)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && books.length === 0 ? <SkeletonRows columns={7} rows={4} /> : null}
                {books.length === 0 && !loading ? (
                  <tr><td colSpan="7" className="empty">Belum ada data buku yang cocok.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card__body">
            <div className="gallery-bar">
              <span className="muted">Urutkan galeri:</span>
              <Select
                value={sort.key}
                onChange={toggle}
                options={SORT_OPTIONS}
                ariaLabel="Urutkan galeri buku"
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => toggle(sort.key)}
              >
                {sort.dir === 'asc' ? 'Naik ↑' : 'Turun ↓'}
              </button>
            </div>

            <div className="book-grid">
              {sorted.map((book) => (
                <BookCard key={book.id} book={book} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            {sorted.length === 0 && !loading ? (
              <p className="empty">Belum ada data buku yang cocok.</p>
            ) : null}
          </div>
        )}
      </section>
    </>
  )
}
