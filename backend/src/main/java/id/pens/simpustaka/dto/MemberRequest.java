package id.pens.simpustaka.dto;

import id.pens.simpustaka.domain.MemberType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Payload pembuatan dan perubahan data anggota (FR-02). */
public record MemberRequest(

        @NotBlank(message = "ID anggota wajib diisi")
        @Size(max = 30, message = "ID anggota maksimal 30 karakter")
        String id,

        @NotNull(message = "Kategori anggota wajib dipilih")
        MemberType type,

        @NotBlank(message = "Nama anggota wajib diisi")
        @Size(max = 120, message = "Nama anggota maksimal 120 karakter")
        String name,

        @NotBlank(message = "Nomor identitas (NIM/NIP) wajib diisi")
        @Size(max = 30, message = "Nomor identitas maksimal 30 karakter")
        String identityNumber) {
}
