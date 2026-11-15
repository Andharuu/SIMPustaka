package id.pens.simpustaka.domain;

import id.pens.simpustaka.exception.ValidationException;

/**
 * Kelas Book merepresentasikan koleksi buku perpustakaan.
 *
 * <p>Menerapkan Encapsulation: seluruh atribut bersifat private dan hanya dapat
 * diakses/diubah melalui getter, setter, serta method stok yang tervalidasi.</p>
 */
public class Book {

    private String id;
    private String title;
    private String author;
    private String category;
    private int stock;

    public Book(String id, String title, String author, String category, int stock) {
        setId(id);
        setTitle(title);
        setAuthor(author);
        setCategory(category);
        setStock(stock);
    }

    public Book(Book other) {
        this(other.id, other.title, other.author, other.category, other.stock);
    }

    public String getId() {
        return id;
    }

    /** ID buku tidak dapat diubah setelah dibuat; perubahan data lain melalui setter. */
    private void setId(String id) {
        if (id == null || id.isBlank()) {
            throw new ValidationException("ID buku wajib diisi");
        }
        this.id = id.trim();
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new ValidationException("Judul buku wajib diisi");
        }
        this.title = title.trim();
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        if (author == null || author.isBlank()) {
            throw new ValidationException("Penulis buku wajib diisi");
        }
        this.author = author.trim();
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        if (category == null || category.isBlank()) {
            throw new ValidationException("Kategori buku wajib diisi");
        }
        this.category = category.trim();
    }

    public int getStock() {
        return stock;
    }

    /** Mengubah jumlah stok secara keseluruhan (tidak boleh negatif). */
    public void setStock(int stock) {
        if (stock < 0) {
            throw new ValidationException("Stok buku tidak boleh negatif");
        }
        this.stock = stock;
    }

    /** Mengurangi stok sebanyak satu saat buku dipinjam. */
    public void decreaseStock() {
        if (stock <= 0) {
            throw new ValidationException("Stok buku \"" + title + "\" habis, buku tidak tersedia");
        }
        this.stock--;
    }

    /** Menambah stok sebanyak satu saat buku dikembalikan. */
    public void increaseStock() {
        this.stock++;
    }

    /** Ketersediaan buku untuk ditampilkan pada daftar katalog (FR-01). */
    public boolean isAvailable() {
        return stock > 0;
    }

    public String stockLabel() {
        return isAvailable() ? "Tersedia" : "Habis";
    }

    @Override
    public String toString() {
        return "Book{id='" + id + "', title='" + title + "', author='" + author
                + "', category='" + category + "', stock=" + stock + '}';
    }
}
