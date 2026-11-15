package id.pens.simpustaka.domain;

import id.pens.simpustaka.exception.ValidationException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Kelas Loan merepresentasikan transaksi peminjaman buku.
 *
 * <p>Menyimpan ID transaksi, data anggota, data buku, tanggal peminjaman,
 * tanggal jatuh tempo, tanggal pengembalian aktual, denda, serta status
 * pengembalian. Tanggal jatuh tempo ditentukan otomatis dari kategori anggota
 * (FR-05) dan denda dihitung otomatis saat pengembalian (FR-07).</p>
 *
 * <p>Nilai jatuh tempo serta tarif denda diambil dari objek {@link Member},
 * sehingga perilaku berbeda antara Student dan Lecturer terjadi secara
 * dinamis melalui Polymorphism.</p>
 */
public class Loan {

    public static final String STATUS_BORROWED = "BORROWED";
    public static final String STATUS_RETURNED = "RETURNED";

    private final String id;
    private final Member member;
    private final Book book;
    private final LocalDate loanDate;
    private final LocalDate dueDate;
    private LocalDate returnDate;
    private long fine;
    private int lateDays;
    private String status;

    /**
     * Membuat transaksi peminjaman baru. Tanggal jatuh tempo dihitung otomatis
     * sebesar durasi peminjaman kategori anggota.
     */
    public Loan(String id, Member member, Book book, LocalDate loanDate) {
        if (id == null || id.isBlank()) {
            throw new ValidationException("ID transaksi wajib diisi");
        }
        if (member == null) {
            throw new ValidationException("Anggota transaksi wajib diisi");
        }
        if (book == null) {
            throw new ValidationException("Buku transaksi wajib diisi");
        }
        this.id = id.trim();
        this.member = member;
        this.book = book;
        this.loanDate = requireDate(loanDate, "Tanggal peminjaman");
        this.dueDate = this.loanDate.plusDays(member.getLoanPeriodDays());
        this.status = STATUS_BORROWED;
        this.fine = 0L;
        this.lateDays = 0;
    }

    /** Konstruktor untuk memuat kembali transaksi yang sudah ada dari penyimpanan. */
    public Loan(String id, Member member, Book book, LocalDate loanDate, LocalDate returnDate,
                long fine, int lateDays, String status) {
        this(id, member, book, loanDate);
        if (returnDate != null) {
            if (returnDate.isBefore(this.loanDate)) {
                throw new ValidationException("Tanggal pengembalian tidak boleh sebelum tanggal peminjaman");
            }
            this.returnDate = returnDate;
        }
        this.fine = Math.max(0L, fine);
        this.lateDays = Math.max(0, lateDays);
        this.status = STATUS_RETURNED.equalsIgnoreCase(status) ? STATUS_RETURNED : STATUS_BORROWED;
    }

    private static LocalDate requireDate(LocalDate value, String label) {
        if (value == null) {
            throw new ValidationException(label + " wajib diisi");
        }
        return value;
    }

    public String getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public Book getBook() {
        return book;
    }

    public LocalDate getLoanDate() {
        return loanDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public long getFine() {
        return fine;
    }

    public int getLateDays() {
        return lateDays;
    }

    public String getStatus() {
        return status;
    }

    public boolean isReturned() {
        return STATUS_RETURNED.equals(status);
    }

    /** Menghitung jumlah hari keterlambatan relatif terhadap tanggal jatuh tempo. */
    public int calculateLateDays(LocalDate referenceDate) {
        LocalDate checked = requireDate(referenceDate, "Tanggal pengembalian");
        long days = ChronoUnit.DAYS.between(dueDate, checked);
        return days > 0 ? (int) days : 0;
    }

    /**
     * Memproses pengembalian buku: mencatat tanggal kembali, menghitung denda,
     * dan mengubah status transaksi.
     *
     * @return besaran denda keterlambatan dalam rupiah
     */
    public long processReturn(LocalDate dateReturned) {
        if (isReturned()) {
            throw new ValidationException("Transaksi " + id + " sudah dikembalikan sebelumnya");
        }
        LocalDate checked = requireDate(dateReturned, "Tanggal pengembalian");
        if (checked.isBefore(loanDate)) {
            throw new ValidationException("Tanggal pengembalian tidak boleh sebelum tanggal peminjaman");
        }
        this.returnDate = checked;
        this.lateDays = calculateLateDays(checked);
        this.fine = member.calculateFine(this.lateDays);
        this.status = STATUS_RETURNED;
        return this.fine;
    }

    /** Jumlah hari keterlambatan bila tanggal acuan melewati jatuh tempo (tanpa mengubah data). */
    public int previewLateDays(LocalDate referenceDate) {
        return calculateLateDays(referenceDate);
    }

    public void markReturnedOnRestore(LocalDate dateReturned, long fine, int lateDays) {
        this.returnDate = dateReturned;
        this.fine = Math.max(0L, fine);
        this.lateDays = Math.max(0, lateDays);
        this.status = STATUS_RETURNED;
    }

    @Override
    public String toString() {
        return "Loan{id='" + id + "', member='" + member.getId() + "', book='" + book.getId()
                + "', loanDate=" + loanDate + ", dueDate=" + dueDate + ", returnDate=" + returnDate
                + ", fine=" + fine + ", status='" + status + "'}";
    }
}
