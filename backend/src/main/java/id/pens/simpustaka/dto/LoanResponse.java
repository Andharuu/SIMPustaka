package id.pens.simpustaka.dto;

import java.time.LocalDate;

/** Data transaksi peminjaman/pengembalian untuk respons API (FR-08). */
public record LoanResponse(
        String id,
        String memberId,
        String memberName,
        String memberCategory,
        String bookId,
        String bookTitle,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate returnDate,
        String status,
        boolean active,
        int lateDays,
        long fine,
        long fineRatePerDay,
        int loanPeriodDays) {
}
