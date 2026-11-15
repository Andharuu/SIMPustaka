package id.pens.simpustaka.dto;

import id.pens.simpustaka.manager.LibraryStats;

/** Ringkasan statistik untuk dasbor petugas. */
public record StatsResponse(
        long totalBooks,
        long availableBooks,
        long totalStock,
        long totalMembers,
        long activeLoans,
        long totalLoans,
        long totalFine) {

    public static StatsResponse from(LibraryStats stats) {
        return new StatsResponse(stats.totalBooks(), stats.availableBooks(), stats.totalStock(),
                stats.totalMembers(), stats.activeLoans(), stats.totalLoans(), stats.totalFine());
    }
}
