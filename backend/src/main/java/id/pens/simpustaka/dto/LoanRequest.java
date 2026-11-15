package id.pens.simpustaka.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/** Payload pencatatan transaksi peminjaman (FR-04). */
public record LoanRequest(

        @NotBlank(message = "Anggota wajib dipilih")
        String memberId,

        @NotBlank(message = "Buku wajib dipilih")
        String bookId,

        /** Opsional; bila kosong sistem memakai tanggal hari ini. */
        LocalDate loanDate) {
}
