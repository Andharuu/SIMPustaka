/** Kartu buku untuk tampilan galeri. */
export default function BookCard({ book, onEdit, onDelete }) {
  return (
    <article className={`book-card${book.available ? '' : ' book-card--empty'}`}>
      <div className="book-card__top">
        <span className="book-card__id">{book.id}</span>
        <span className={`badge ${book.available ? 'badge--success' : 'badge--danger'}`}>
          {book.available ? 'Tersedia' : 'Habis'}
        </span>
      </div>

      <h3 className="book-card__title" title={book.title}>{book.title}</h3>
      <p className="book-card__author">{book.author}</p>

      <div className="book-card__foot">
        <span className="chip">{book.category}</span>
        <span className="book-card__stock">
          <strong>{book.stock}</strong> eksemplar
        </span>
      </div>

      <div className="book-card__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(book)}>Ubah</button>
        <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(book)}>Hapus</button>
      </div>
    </article>
  )
}
