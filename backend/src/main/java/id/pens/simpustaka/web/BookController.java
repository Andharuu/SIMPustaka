package id.pens.simpustaka.web;

import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.dto.BookRequest;
import id.pens.simpustaka.dto.BookResponse;
import id.pens.simpustaka.dto.DtoMapper;
import id.pens.simpustaka.manager.LibraryManager;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Endpoint pengelolaan data buku dan pencarian katalog (FR-01, FR-03). */
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final LibraryManager libraryManager;

    public BookController(LibraryManager libraryManager) {
        this.libraryManager = libraryManager;
    }

    @GetMapping
    public List<BookResponse> list(@RequestParam(name = "q", required = false) String keyword) {
        return DtoMapper.toBooks(libraryManager.searchBooks(keyword));
    }

    @GetMapping("/{id}")
    public BookResponse detail(@PathVariable String id) {
        return DtoMapper.toBook(libraryManager.findBook(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse create(@Valid @RequestBody BookRequest request) {
        Book book = libraryManager.addBook(request.id(), request.title(), request.author(),
                request.category(), request.stock());
        return DtoMapper.toBook(book);
    }

    @PutMapping("/{id}")
    public BookResponse update(@PathVariable String id, @Valid @RequestBody BookRequest request) {
        Book book = libraryManager.updateBook(id, request.title(), request.author(),
                request.category(), request.stock());
        return DtoMapper.toBook(book);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        libraryManager.deleteBook(id);
    }
}
