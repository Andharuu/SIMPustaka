package id.pens.simpustaka.exception;

/** Exception ketika data yang diminta tidak ditemukan (buku, anggota, atau transaksi). */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
