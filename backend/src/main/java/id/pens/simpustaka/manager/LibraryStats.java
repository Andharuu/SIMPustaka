package id.pens.simpustaka.manager;

/** Ringkasan statistik koleksi dan sirkulasi untuk dasbor petugas. */
public record LibraryStats(
        long totalBooks,
        long availableBooks,
        long totalStock,
        long totalMembers,
        long activeLoans,
        long totalLoans,
        long totalFine) {
}
