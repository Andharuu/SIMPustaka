package id.pens.simpustaka.exception;

/**
 * Exception untuk kegagalan proses penyimpanan atau pembacaan data permanen.
 *
 * <p>Dilempar oleh {@code DataManager} ketika terjadi kesalahan I/O atau berkas
 * data tidak valid, sehingga kesalahan penyimpanan tidak membuat aplikasi berhenti
 * secara mendadak (FR-11).</p>
 */
public class DataAccessException extends RuntimeException {

    public DataAccessException(String message) {
        super(message);
    }

    public DataAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
