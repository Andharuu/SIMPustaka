package id.pens.simpustaka.dto;

import java.time.LocalDate;

/** Payload pencatatan pengembalian buku (FR-06). */
public record ReturnRequest(

        /** Opsional; bila kosong sistem memakai tanggal hari ini. */
        LocalDate returnDate) {
}
