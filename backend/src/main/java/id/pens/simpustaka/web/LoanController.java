package id.pens.simpustaka.web;

import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.dto.DtoMapper;
import id.pens.simpustaka.dto.LoanRequest;
import id.pens.simpustaka.dto.LoanResponse;
import id.pens.simpustaka.dto.ReturnRequest;
import id.pens.simpustaka.manager.LibraryManager;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Endpoint transaksi peminjaman, pengembalian, dan riwayat transaksi
 * (FR-04, FR-05, FR-06, FR-07, FR-08).
 */
@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LibraryManager libraryManager;

    public LoanController(LibraryManager libraryManager) {
        this.libraryManager = libraryManager;
    }

    /** Riwayat seluruh transaksi, atau hanya transaksi aktif bila {@code active=true}. */
    @GetMapping
    public List<LoanResponse> list(@RequestParam(name = "active", required = false) Boolean active) {
        if (Boolean.TRUE.equals(active)) {
            return DtoMapper.toLoans(libraryManager.getActiveLoans());
        }
        return DtoMapper.toLoans(libraryManager.getLoanHistory());
    }

    @GetMapping("/{id}")
    public LoanResponse detail(@PathVariable String id) {
        Loan loan = libraryManager.findLoan(id);
        return DtoMapper.toLoan(loan, !loan.isReturned());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse borrow(@Valid @RequestBody LoanRequest request) {
        Loan loan = libraryManager.borrowBook(request.memberId(), request.bookId(), request.loanDate());
        return DtoMapper.toLoan(loan, !loan.isReturned());
    }

    @PostMapping("/{id}/return")
    public LoanResponse giveBack(@PathVariable String id, @RequestBody(required = false) ReturnRequest request) {
        LocalDate returnDate = request == null ? null : request.returnDate();
        Loan loan = libraryManager.returnBook(id, returnDate);
        return DtoMapper.toLoan(loan, false);
    }
}
