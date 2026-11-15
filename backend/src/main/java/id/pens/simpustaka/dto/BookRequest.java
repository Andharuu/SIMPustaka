package id.pens.simpustaka.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Payload pembuatan dan perubahan data buku (FR-01). */
public record BookRequest(

        @NotBlank(message = "ID buku wajib diisi")
        @Size(max = 30, message = "ID buku maksimal 30 karakter")
        String id,

        @NotBlank(message = "Judul buku wajib diisi")
        @Size(max = 200, message = "Judul buku maksimal 200 karakter")
        String title,

        @NotBlank(message = "Penulis buku wajib diisi")
        @Size(max = 120, message = "Penulis maksimal 120 karakter")
        String author,

        @NotBlank(message = "Kategori buku wajib diisi")
        @Size(max = 60, message = "Kategori maksimal 60 karakter")
        String category,

        @NotNull(message = "Stok buku wajib diisi")
        @Min(value = 0, message = "Stok buku tidak boleh negatif")
        Integer stock) {
}
