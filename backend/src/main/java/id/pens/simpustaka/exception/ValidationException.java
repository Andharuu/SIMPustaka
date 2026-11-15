package id.pens.simpustaka.exception;

/**
 * Exception untuk kesalahan validasi input pengguna (FR-11).
 *
 * <p>Dilempar ketika data yang dimasukkan tidak memenuhi aturan bisnis, misalnya
 * field kosong, duplikasi ID, stok habis, atau kuota peminjaman terlampaui.</p>
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
