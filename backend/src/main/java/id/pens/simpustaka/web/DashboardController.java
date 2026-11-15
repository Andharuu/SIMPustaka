package id.pens.simpustaka.web;

import id.pens.simpustaka.dto.StatsResponse;
import id.pens.simpustaka.manager.LibraryManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint ringkasan data untuk dasbor petugas. */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LibraryManager libraryManager;

    public DashboardController(LibraryManager libraryManager) {
        this.libraryManager = libraryManager;
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return StatsResponse.from(libraryManager.getStats());
    }
}
