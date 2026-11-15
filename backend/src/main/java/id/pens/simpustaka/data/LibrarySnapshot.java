package id.pens.simpustaka.data;

import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.domain.Member;

import java.util.Collections;
import java.util.List;

/**
 * Hasil pembacaan data dari penyimpanan: kumpulan buku, anggota, dan transaksi.
 *
 * <p>Immutable agar data hasil muat tidak dapat diubah secara tidak sengaja
 * di luar {@link id.pens.simpustaka.manager.LibraryManager}.</p>
 */
public final class LibrarySnapshot {

    private final List<Book> books;
    private final List<Member> members;
    private final List<Loan> loans;

    public LibrarySnapshot(List<Book> books, List<Member> members, List<Loan> loans) {
        this.books = List.copyOf(books);
        this.members = List.copyOf(members);
        this.loans = List.copyOf(loans);
    }

    public static LibrarySnapshot empty() {
        return new LibrarySnapshot(Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
    }

    public List<Book> getBooks() {
        return books;
    }

    public List<Member> getMembers() {
        return members;
    }

    public List<Loan> getLoans() {
        return loans;
    }

    public boolean isEmpty() {
        return books.isEmpty() && members.isEmpty() && loans.isEmpty();
    }
}
