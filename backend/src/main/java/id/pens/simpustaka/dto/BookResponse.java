package id.pens.simpustaka.dto;

/** Data buku untuk respons API. */
public record BookResponse(
        String id,
        String title,
        String author,
        String category,
        int stock,
        boolean available) {
}
