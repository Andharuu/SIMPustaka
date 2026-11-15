package id.pens.simpustaka.manager;

import id.pens.simpustaka.data.DataManager;
import id.pens.simpustaka.data.LibrarySnapshot;
import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Lecturer;
import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.domain.Member;
import id.pens.simpustaka.domain.MemberType;
import id.pens.simpustaka.domain.Student;
import id.pens.simpustaka.exception.DataAccessException;
import id.pens.simpustaka.exception.NotFoundException;
import id.pens.simpustaka.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Kelas LibraryManager — pusat pengelolaan operasional perpustakaan.
 *
 * <p>Bertanggung jawab atas pengelolaan data buku, data anggota, pencarian data,
 * pemrosesan transaksi peminjaman dan pengembalian beserta validasinya, serta
 * koordinasi penyimpanan data melalui {@link DataManager}.</p>
 *
 * <p>Kumpulan data dikelola menggunakan Java Collection Framework ({@link ArrayList})
 * sesuai rancangan sistem. Setiap operasi tulis diikuti penyimpanan data agar data
 * tetap permanen (FR-09).</p>
 */
@Component
public class LibraryManager {

    private static final Logger log = LoggerFactory.getLogger(LibraryManager.class);
    private static final DateTimeFormatter LOAN_ID_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ArrayList<Book> books = new ArrayList<>();
    private final ArrayList<Member> members = new ArrayList<>();
    private final ArrayList<Loan> loans = new ArrayList<>();
    private final DataManager dataManager;

    private long loanSequence = 0L;

    public LibraryManager(DataManager dataManager) {
        this.dataManager = dataManager;
    }

    // =====================================================================
    // FR-10 Pembacaan data
    // =====================================================================

    /**
     * Memuat kembali data yang tersimpan saat aplikasi dijalankan.
     * Bila berkas data rusak, data yang gagal dimuat tidak mematikan aplikasi;
     * kesalahan dicatat dan koleksi dibiarkan kosong agar petugas dapat bekerja
     * kembali (Exception Handling).
     */
    public synchronized void loadFromStorage() {
        try {
            LibrarySnapshot snapshot = dataManager.loadData();
            books.clear();
            books.addAll(snapshot.getBooks());
            members.clear();
            members.addAll(snapshot.getMembers());
            loans.clear();
            loans.addAll(snapshot.getLoans());
            loanSequence = loans.stream()
                    .map(Loan::getId)
                    .filter(id -> id.length() > 12)
                    .map(id -> id.substring(11))
                    .filter(suffix -> suffix.matches("\\d+"))
                    .mapToLong(Long::parseLong)
                    .max()
                    .orElse(0L);
            log.info("Data dimuat: {} buku, {} anggota, {} transaksi",
                    books.size(), members.size(), loans.size());
        } catch (DataAccessException e) {
            log.error("Gagal memuat data tersimpan: {}", e.getMessage(), e);
            books.clear();
            members.clear();
            loans.clear();
            throw e;
        }
    }

    /** Menyimpan seluruh data ke penyimpanan permanen (FR-09). */
    public synchronized void persist() {
        dataManager.saveData(books, members, loans);
    }

    // =====================================================================
    // FR-01 Kelola data buku
    // =====================================================================

    public synchronized List<Book> getBooks() {
        return new ArrayList<>(books);
    }

    public synchronized Book findBook(String id) {
        return books.stream()
                .filter(book -> book.getId().equalsIgnoreCase(normalize(id)))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Buku dengan ID " + id + " tidak ditemukan"));
    }

    public synchronized Book addBook(String id, String title, String author, String category, int stock) {
        String cleanId = requireText(id, "ID buku");
        if (books.stream().anyMatch(book -> book.getId().equalsIgnoreCase(cleanId))) {
            throw new ValidationException("ID buku " + cleanId + " sudah digunakan");
        }
        Book book = new Book(cleanId, title, author, category, stock);
        books.add(book);
        persistSafely();
        return book;
    }

    public synchronized Book updateBook(String id, String title, String author, String category, int stock) {
        Book book = findBook(id);
        book.setTitle(title);
        book.setAuthor(author);
        book.setCategory(category);
        book.setStock(stock);
        persistSafely();
        return book;
    }

    public synchronized void deleteBook(String id) {
        Book book = findBook(id);
        long activeLoans = loans.stream()
                .filter(loan -> !loan.isReturned() && loan.getBook().getId().equals(book.getId()))
                .count();
        if (activeLoans > 0) {
            throw new ValidationException("Buku \"" + book.getTitle()
                    + "\" tidak dapat dihapus karena masih dipinjam pada " + activeLoans + " transaksi aktif");
        }
        books.remove(book);
        persistSafely();
    }

    // =====================================================================
    // FR-02 Kelola data anggota
    // =====================================================================

    public synchronized List<Member> getMembers() {
        return new ArrayList<>(members);
    }

    public synchronized Member findMember(String id) {
        return members.stream()
                .filter(member -> member.getId().equalsIgnoreCase(normalize(id)))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Anggota dengan ID " + id + " tidak ditemukan"));
    }

    public synchronized Member addMember(MemberType type, String id, String name, String identityNumber) {
        if (type == null) {
            throw new ValidationException("Kategori anggota wajib dipilih (Student atau Lecturer)");
        }
        String cleanId = requireText(id, "ID anggota");
        if (members.stream().anyMatch(member -> member.getId().equalsIgnoreCase(cleanId))) {
            throw new ValidationException("ID anggota " + cleanId + " sudah digunakan");
        }
        if (members.stream().anyMatch(member -> member.getIdentityNumber().equalsIgnoreCase(normalize(identityNumber)))) {
            throw new ValidationException("Nomor identitas " + identityNumber + " sudah terdaftar");
        }
        Member member = instantiateMember(type, cleanId, name, identityNumber);
        members.add(member);
        persistSafely();
        return member;
    }

    public synchronized Member updateMember(String id, MemberType type, String name, String identityNumber) {
        Member member = findMember(id);
        member.setName(name);
        member.setIdentityNumber(identityNumber);

        if (type != null && type != member.getType()) {
            if (member.getActiveLoanCount() > 0) {
                throw new ValidationException("Kategori anggota tidak dapat diubah karena masih memiliki "
                        + member.getActiveLoanCount() + " peminjaman aktif");
            }
            Member replacement = instantiateMember(type, member.getId(), member.getName(), member.getIdentityNumber());
            members.set(members.indexOf(member), replacement);
            persistSafely();
            return replacement;
        }
        persistSafely();
        return member;
    }

    public synchronized void deleteMember(String id) {
        Member member = findMember(id);
        if (member.getActiveLoanCount() > 0) {
            throw new ValidationException("Anggota " + member.getName()
                    + " tidak dapat dihapus karena masih memiliki " + member.getActiveLoanCount()
                    + " peminjaman aktif");
        }
        members.remove(member);
        persistSafely();
    }

    // =====================================================================
    // FR-03 Pencarian data
    // =====================================================================

    /** Mencari buku berdasarkan judul atau identitas buku (ID, penulis, kategori). */
    public synchronized List<Book> searchBooks(String keyword) {
        String needle = normalize(keyword);
        if (needle.isEmpty()) {
            return getBooks();
        }
        List<Book> result = new ArrayList<>();
        for (Book book : books) {
            if (contains(book.getId(), needle)
                    || contains(book.getTitle(), needle)
                    || contains(book.getAuthor(), needle)
                    || contains(book.getCategory(), needle)) {
                result.add(book);
            }
        }
        return result;
    }

    /** Mencari anggota berdasarkan identitas anggota (ID, nama, NIM/NIP). */
    public synchronized List<Member> searchMembers(String keyword) {
        String needle = normalize(keyword);
        if (needle.isEmpty()) {
            return getMembers();
        }
        List<Member> result = new ArrayList<>();
        for (Member member : members) {
            if (contains(member.getId(), needle)
                    || contains(member.getName(), needle)
                    || contains(member.getIdentityNumber(), needle)
                    || contains(member.getCategoryLabel(), needle)) {
                result.add(member);
            }
        }
        return result;
    }

    // =====================================================================
    // FR-04, FR-05 Transaksi peminjaman
    // =====================================================================

    public synchronized List<Loan> getLoans() {
        return new ArrayList<>(loans);
    }

    public synchronized Loan findLoan(String id) {
        return loans.stream()
                .filter(loan -> loan.getId().equalsIgnoreCase(normalize(id)))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Transaksi dengan ID " + id + " tidak ditemukan"));
    }

    /** Daftar transaksi yang masih berjalan (buku belum dikembalikan). */
    public synchronized List<Loan> getActiveLoans() {
        return loans.stream().filter(loan -> !loan.isReturned()).toList();
    }

    /** Riwayat transaksi, terbaru di atas (FR-08). */
    public synchronized List<Loan> getLoanHistory() {
        List<Loan> history = new ArrayList<>(loans);
        history.sort(Comparator.comparing(Loan::getLoanDate).reversed()
                .thenComparing(Loan::getId, Comparator.reverseOrder()));
        return history;
    }

    /**
     * Mencatat transaksi peminjaman (FR-04) dan menentukan jatuh tempo secara
     * otomatis berdasarkan kategori anggota (FR-05).
     *
     * <p>Validasi yang dilakukan: identitas anggota, identitas buku, ketersediaan
     * stok, duplikasi peminjaman buku yang sama, serta batas kuota peminjaman
     * sesuai kategori anggota.</p>
     */
    public synchronized Loan borrowBook(String memberId, String bookId, LocalDate loanDate) {
        Member member = findMember(memberId);
        Book book = findBook(bookId);
        LocalDate effectiveDate = loanDate == null ? LocalDate.now() : loanDate;

        if (!book.isAvailable()) {
            throw new ValidationException("Stok buku \"" + book.getTitle() + "\" habis, transaksi tidak dapat diproses");
        }
        boolean alreadyBorrowed = loans.stream()
                .anyMatch(loan -> !loan.isReturned()
                        && loan.getMember().getId().equalsIgnoreCase(member.getId())
                        && loan.getBook().getId().equalsIgnoreCase(book.getId()));
        if (alreadyBorrowed) {
            throw new ValidationException("Anggota " + member.getName() + " masih meminjam buku \""
                    + book.getTitle() + "\" dan belum mengembalikannya");
        }
        if (member.getActiveLoanCount() >= member.getLoanQuota()) {
            throw new ValidationException("Kuota peminjaman " + member.getCategoryLabel() + " tercapai (maksimal "
                    + member.getLoanQuota() + " buku). Anggota " + member.getName()
                    + " masih meminjam " + member.getActiveLoanCount() + " buku");
        }

        Loan loan = new Loan(nextLoanId(effectiveDate), member, book, effectiveDate);
        book.decreaseStock();
        member.addActiveLoan(loan.getId());
        loans.add(loan);
        persistSafely();
        return loan;
    }

    // =====================================================================
    // FR-06, FR-07 Transaksi pengembalian dan perhitungan denda
    // =====================================================================

    /**
     * Mencatat pengembalian buku (FR-06) serta menghitung denda keterlambatan
     * secara otomatis sesuai kategori anggota (FR-07), lalu memperbarui stok.
     */
    public synchronized Loan returnBook(String loanId, LocalDate returnDate) {
        Loan loan = findLoan(loanId);
        if (loan.isReturned()) {
            throw new ValidationException("Transaksi " + loan.getId() + " sudah dikembalikan pada "
                    + loan.getReturnDate());
        }
        LocalDate effectiveDate = returnDate == null ? LocalDate.now() : returnDate;
        loan.processReturn(effectiveDate);
        loan.getBook().increaseStock();
        loan.getMember().removeActiveLoan(loan.getId());
        persistSafely();
        return loan;
    }

    /** Menghitung denda yang akan muncul bila transaksi dikembalikan pada tanggal tertentu. */
    public synchronized int previewLateDays(String loanId, LocalDate returnDate) {
        return findLoan(loanId).previewLateDays(returnDate == null ? LocalDate.now() : returnDate);
    }

    // =====================================================================
    // Internal helpers
    // =====================================================================

    private Member instantiateMember(MemberType type, String id, String name, String identityNumber) {
        return switch (type) {
            case STUDENT -> new Student(id, name, identityNumber);
            case LECTURER -> new Lecturer(id, name, identityNumber);
        };
    }

    private String nextLoanId(LocalDate loanDate) {
        loanSequence++;
        return "TRX-" + loanDate.format(LOAN_ID_DATE) + "-" + String.format("%04d", loanSequence);
    }

    /** Menyimpan data setelah perubahan; kegagalan penyimpanan dilaporkan sebagai kesalahan proses. */
    private void persistSafely() {
        try {
            persist();
        } catch (DataAccessException e) {
            log.error("Perubahan data gagal disimpan: {}", e.getMessage(), e);
            throw e;
        }
    }

    private static String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new ValidationException(label + " wajib diisi");
        }
        return value.trim();
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    /** Statistik ringkas untuk dasbor petugas. */
    public synchronized LibraryStats getStats() {
        long availableTitles = books.stream().filter(Book::isAvailable).count();
        long totalStock = books.stream().mapToLong(Book::getStock).sum();
        long activeLoans = loans.stream().filter(loan -> !loan.isReturned()).count();
        long totalFine = loans.stream().mapToLong(Loan::getFine).sum();
        return new LibraryStats(books.size(), availableTitles, totalStock, members.size(), activeLoans,
                loans.size(), totalFine);
    }

    /** Anggota berdasarkan ID opsional, dipakai untuk tampilan detail transaksi. */
    public synchronized Optional<Member> tryFindMember(String id) {
        return members.stream().filter(member -> member.getId().equalsIgnoreCase(normalize(id))).findFirst();
    }
}
