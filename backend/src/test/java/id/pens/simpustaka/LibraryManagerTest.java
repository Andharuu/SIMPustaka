package id.pens.simpustaka;

import id.pens.simpustaka.data.FileDataManager;
import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.domain.Member;
import id.pens.simpustaka.domain.MemberType;
import id.pens.simpustaka.exception.NotFoundException;
import id.pens.simpustaka.exception.ValidationException;
import id.pens.simpustaka.manager.LibraryManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pengujian aturan bisnis SIMPustaka: kuota, durasi pinjam, jatuh tempo,
 * denda, validasi input, serta penyimpanan dan pembacaan data.
 */
class LibraryManagerTest {

    @TempDir
    Path tempDirectory;

    private LibraryManager manager;

    @BeforeEach
    void setUp() {
        manager = new LibraryManager(new FileDataManager(tempDirectory.toString(), "perpustakaan.csv"));
        manager.loadFromStorage();
    }

    // ---------------------------------------------------------------- FR-01
    @Test
    @DisplayName("FR-01: buku dapat ditambah, diubah, dan dihapus")
    void bookCrud() {
        manager.addBook("B-001", "Algoritma dan Pemrograman", "Rinaldi Munir", "Informatika", 3);
        assertThat(manager.getBooks()).hasSize(1);

        manager.updateBook("B-001", "Algoritma dan Pemrograman Edisi 2", "Rinaldi Munir", "Informatika", 5);
        Book updated = manager.findBook("B-001");
        assertThat(updated.getTitle()).contains("Edisi 2");
        assertThat(updated.getStock()).isEqualTo(5);

        manager.deleteBook("B-001");
        assertThat(manager.getBooks()).isEmpty();
    }

    @Test
    @DisplayName("FR-01: ID buku duplikat ditolak")
    void duplicateBookIdRejected() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 1);
        assertThatThrownBy(() -> manager.addBook("B-001", "Buku B", "Penulis", "Umum", 1))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("sudah digunakan");
    }

    // ---------------------------------------------------------------- FR-02
    @Test
    @DisplayName("FR-02: aturan sirkulasi Student 3 buku/7 hari/Rp1.000 dan Lecturer 5 buku/14 hari/Rp2.000")
    void memberRulesMatchSpecification() {
        Member student = manager.addMember(MemberType.STUDENT, "A-001", "Putri Norma Yunita", "3125521010");
        Member lecturer = manager.addMember(MemberType.LECTURER, "A-002", "Andharu Raffi", "198701012020121001");

        assertThat(student.getLoanQuota()).isEqualTo(3);
        assertThat(student.getLoanPeriodDays()).isEqualTo(7);
        assertThat(student.getFineRatePerDay()).isEqualTo(1_000L);
        assertThat(student.getCategoryLabel()).isEqualTo("Mahasiswa");

        assertThat(lecturer.getLoanQuota()).isEqualTo(5);
        assertThat(lecturer.getLoanPeriodDays()).isEqualTo(14);
        assertThat(lecturer.getFineRatePerDay()).isEqualTo(2_000L);
        assertThat(lecturer.getCategoryLabel()).isEqualTo("Dosen");
    }

    @Test
    @DisplayName("FR-02: anggota dengan peminjaman aktif tidak dapat dihapus")
    void memberWithActiveLoanCannotBeDeleted() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 2);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        manager.borrowBook("A-001", "B-001", LocalDate.of(2026, 1, 1));

        assertThatThrownBy(() -> manager.deleteMember("A-001"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("peminjaman aktif");
    }

    // ---------------------------------------------------------------- FR-03
    @Test
    @DisplayName("FR-03: pencarian buku dan anggota tidak peka huruf besar/kecil")
    void searching() {
        manager.addBook("B-001", "Struktur Data", "Rosa A. S.", "Informatika", 2);
        manager.addBook("B-002", "Basis Data", "Abdul Kadir", "Informatika", 2);
        manager.addMember(MemberType.LECTURER, "A-002", "Saniyatul Mawaddah", "198701012020121001");

        assertThat(manager.searchBooks("struktur")).extracting(Book::getId).containsExactly("B-001");
        assertThat(manager.searchBooks("B-002")).hasSize(1);
        assertThat(manager.searchMembers("saniyatul")).extracting(Member::getId).containsExactly("A-002");
    }

    // ------------------------------------------------- FR-04, FR-05, FR-06
    @Test
    @DisplayName("FR-05: jatuh tempo otomatis 7 hari (Mahasiswa) dan 14 hari (Dosen), stok berkurang")
    void dueDateIsDerivedFromMemberCategory() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 5);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        manager.addMember(MemberType.LECTURER, "A-002", "Andharu", "198701012020121001");
        LocalDate loanDate = LocalDate.of(2026, 2, 10);

        Loan studentLoan = manager.borrowBook("A-001", "B-001", loanDate);
        Loan lecturerLoan = manager.borrowBook("A-002", "B-001", loanDate);

        assertThat(studentLoan.getDueDate()).isEqualTo(loanDate.plusDays(7));
        assertThat(lecturerLoan.getDueDate()).isEqualTo(loanDate.plusDays(14));
        assertThat(manager.findBook("B-001").getStock()).isEqualTo(3);
    }

    @Test
    @DisplayName("FR-04: peminjaman ditolak bila stok habis")
    void borrowRejectedWhenStockEmpty() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 1);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        manager.addMember(MemberType.STUDENT, "A-002", "Rekan", "3125521011");
        manager.borrowBook("A-001", "B-001", LocalDate.now());

        assertThatThrownBy(() -> manager.borrowBook("A-002", "B-001", LocalDate.now()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("habis");
    }

    @Test
    @DisplayName("FR-04: kuota Mahasiswa dibatasi 3 buku, Dosen 5 buku")
    void quotaIsEnforced() {
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        manager.addMember(MemberType.LECTURER, "A-002", "Andharu", "198701012020121001");
        for (int i = 1; i <= 6; i++) {
            manager.addBook("B-00" + i, "Buku " + i, "Penulis", "Umum", 5);
        }

        manager.borrowBook("A-001", "B-001", LocalDate.now());
        manager.borrowBook("A-001", "B-002", LocalDate.now());
        manager.borrowBook("A-001", "B-003", LocalDate.now());
        assertThatThrownBy(() -> manager.borrowBook("A-001", "B-004", LocalDate.now()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Kuota peminjaman Mahasiswa tercapai (maksimal 3 buku)");

        for (int i = 1; i <= 5; i++) {
            manager.borrowBook("A-002", "B-00" + i, LocalDate.now());
        }
        assertThatThrownBy(() -> manager.borrowBook("A-002", "B-006", LocalDate.now()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Kuota peminjaman Dosen tercapai (maksimal 5 buku)");
    }

    @Test
    @DisplayName("FR-04: identitas anggota/buku yang tidak terdaftar ditolak")
    void borrowRejectedForUnknownIdentity() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 1);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");

        assertThatThrownBy(() -> manager.borrowBook("A-999", "B-001", LocalDate.now()))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> manager.borrowBook("A-001", "B-999", LocalDate.now()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("FR-06: pengembalian tepat waktu tanpa denda dan stok bertambah kembali")
    void onTimeReturnHasNoFine() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 2);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        LocalDate loanDate = LocalDate.of(2026, 3, 1);
        Loan loan = manager.borrowBook("A-001", "B-001", loanDate);

        Loan returned = manager.returnBook(loan.getId(), loanDate.plusDays(7));

        assertThat(returned.getLateDays()).isZero();
        assertThat(returned.getFine()).isZero();
        assertThat(returned.getStatus()).isEqualTo(Loan.STATUS_RETURNED);
        assertThat(manager.findBook("B-001").getStock()).isEqualTo(2);
        assertThat(manager.findMember("A-001").getActiveLoanCount()).isZero();
    }

    // ---------------------------------------------------------------- FR-07
    @Test
    @DisplayName("FR-07: denda Mahasiswa Rp1.000/hari dan Dosen Rp2.000/hari")
    void fineCalculationPerCategory() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 5);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        manager.addMember(MemberType.LECTURER, "A-002", "Andharu", "198701012020121001");
        LocalDate loanDate = LocalDate.of(2026, 4, 1);

        Loan studentLoan = manager.borrowBook("A-001", "B-001", loanDate);
        Loan lecturerLoan = manager.borrowBook("A-002", "B-001", loanDate);

        // Jatuh tempo mahasiswa 8 April, dikembalikan 11 April -> 3 hari terlambat
        Loan studentReturned = manager.returnBook(studentLoan.getId(), loanDate.plusDays(10));
        assertThat(studentReturned.getLateDays()).isEqualTo(3);
        assertThat(studentReturned.getFine()).isEqualTo(3_000L);

        // Jatuh tempo dosen 15 April, dikembalikan 20 April -> 5 hari terlambat
        Loan lecturerReturned = manager.returnBook(lecturerLoan.getId(), loanDate.plusDays(19));
        assertThat(lecturerReturned.getLateDays()).isEqualTo(5);
        assertThat(lecturerReturned.getFine()).isEqualTo(10_000L);
    }

    @Test
    @DisplayName("FR-06: transaksi yang sudah dikembalikan tidak dapat dikembalikan dua kali")
    void doubleReturnRejected() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 2);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        Loan loan = manager.borrowBook("A-001", "B-001", LocalDate.of(2026, 5, 1));
        manager.returnBook(loan.getId(), LocalDate.of(2026, 5, 2));

        assertThatThrownBy(() -> manager.returnBook(loan.getId(), LocalDate.of(2026, 5, 3)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("sudah dikembalikan");
    }

    // ---------------------------------------------------------------- FR-08
    @Test
    @DisplayName("FR-08: riwayat transaksi menyimpan peminjaman dan pengembalian")
    void loanHistoryKeepsBothStates() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 5);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        Loan loan = manager.borrowBook("A-001", "B-001", LocalDate.of(2026, 6, 1));
        manager.returnBook(loan.getId(), LocalDate.of(2026, 6, 9));

        List<Loan> history = manager.getLoanHistory();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).isReturned()).isTrue();
        assertThat(history.get(0).getReturnDate()).isEqualTo(LocalDate.of(2026, 6, 9));
        assertThat(manager.getActiveLoans()).isEmpty();
    }

    // ---------------------------------------------------------- FR-09, FR-10
    @Test
    @DisplayName("FR-09/FR-10: data buku, anggota, dan transaksi tetap ada setelah aplikasi dimuat ulang")
    void dataPersistsAcrossReload() {
        manager.addBook("B-001", "Buku A", "Rosa A. S.", "Informatika", 4);
        manager.addMember(MemberType.LECTURER, "A-002", "Andharu Raffi", "198701012020121001");
        Loan loan = manager.borrowBook("A-002", "B-001", LocalDate.of(2026, 7, 1));
        manager.returnBook(loan.getId(), LocalDate.of(2026, 7, 20));

        LibraryManager reloaded = new LibraryManager(
                new FileDataManager(tempDirectory.toString(), "perpustakaan.csv"));
        reloaded.loadFromStorage();

        assertThat(reloaded.getBooks()).hasSize(1);
        assertThat(reloaded.getBooks().get(0).getStock()).isEqualTo(4);
        assertThat(reloaded.getMembers()).hasSize(1);
        assertThat(reloaded.getMembers().get(0)).isInstanceOf(id.pens.simpustaka.domain.Lecturer.class);
        assertThat(reloaded.getLoanHistory()).hasSize(1);
        assertThat(reloaded.getLoanHistory().get(0).getFine()).isEqualTo(10_000L);
        assertThat(reloaded.getLoanHistory().get(0).getLateDays()).isEqualTo(5);
    }

    @Test
    @DisplayName("FR-10: aplikasi tetap dapat dijalankan saat berkas data belum ada")
    void missingFileYieldsEmptyLibrary() {
        assertThat(manager.getBooks()).isEmpty();
        assertThat(manager.getMembers()).isEmpty();
        assertThat(manager.getLoans()).isEmpty();
    }

    // ---------------------------------------------------------------- FR-11
    @Test
    @DisplayName("FR-11: berkas data rusak menghasilkan pesan kesalahan yang jelas")
    void corruptedFileIsReported() throws IOException {
        Path file = tempDirectory.resolve("perpustakaan.csv");
        Files.writeString(file, "[BOOK]\nB-001;Judul Saja\n", StandardCharsets.UTF_8);

        LibraryManager broken = new LibraryManager(
                new FileDataManager(tempDirectory.toString(), "perpustakaan.csv"));
        assertThatThrownBy(broken::loadFromStorage)
                .isInstanceOf(id.pens.simpustaka.exception.DataAccessException.class)
                .hasMessageContaining("jumlah kolom");
    }

    @Test
    @DisplayName("FR-11: input tidak valid ditolak sebelum data disimpan")
    void invalidInputRejected() {
        assertThatThrownBy(() -> manager.addBook("B-001", "  ", "Penulis", "Umum", 1))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> manager.addBook("B-002", "Buku", "Penulis", "Umum", -1))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> manager.addMember(MemberType.STUDENT, "A-001", "", "3125521010"))
                .isInstanceOf(ValidationException.class);
        assertThat(manager.getBooks()).isEmpty();
    }

    @Test
    @DisplayName("FR-11: tanggal pengembalian sebelum tanggal pinjam ditolak")
    void returnBeforeLoanDateRejected() {
        manager.addBook("B-001", "Buku A", "Penulis", "Umum", 2);
        manager.addMember(MemberType.STUDENT, "A-001", "Putri", "3125521010");
        Loan loan = manager.borrowBook("A-001", "B-001", LocalDate.of(2026, 8, 10));

        assertThatThrownBy(() -> manager.returnBook(loan.getId(), LocalDate.of(2026, 8, 1)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("sebelum tanggal peminjaman");
    }
}
