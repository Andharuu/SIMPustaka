package id.pens.simpustaka;

import id.pens.simpustaka.exception.DataAccessException;
import id.pens.simpustaka.manager.LibraryManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

/**
 * Titik masuk aplikasi SIMPustaka.
 *
 * <p>Setelah konteks aplikasi siap, data permanen dimuat kembali dari penyimpanan
 * (FR-10) sehingga koleksi buku, anggota, dan riwayat transaksi tetap tersedia
 * meskipun aplikasi sempat ditutup.</p>
 */
@SpringBootApplication
public class SIMPustakaApplication {

    private static final Logger log = LoggerFactory.getLogger(SIMPustakaApplication.class);

    private final LibraryManager libraryManager;

    public SIMPustakaApplication(LibraryManager libraryManager) {
        this.libraryManager = libraryManager;
    }

    public static void main(String[] args) {
        SpringApplication.run(SIMPustakaApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void loadPersistedData() {
        try {
            libraryManager.loadFromStorage();
        } catch (DataAccessException e) {
            log.error("Aplikasi berjalan tanpa data tersimpan: {}", e.getMessage());
        }
    }
}
