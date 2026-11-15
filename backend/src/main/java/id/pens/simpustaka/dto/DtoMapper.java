package id.pens.simpustaka.dto;

import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Member;
import id.pens.simpustaka.domain.MemberType;

import java.util.List;

/** Kumpulan pemetaan objek domain ke bentuk respons JSON. */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static BookResponse toBook(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getAuthor(), book.getCategory(),
                book.getStock(), book.isAvailable());
    }

    public static List<BookResponse> toBooks(List<Book> books) {
        return books.stream().map(DtoMapper::toBook).toList();
    }

    public static MemberResponse toMember(Member member) {
        return new MemberResponse(member.getId(), member.getName(), member.getIdentityNumber(),
                member.getType(), member.getCategoryLabel(), member.getLoanQuota(),
                member.getLoanPeriodDays(), member.getFineRatePerDay(), member.getActiveLoanCount(),
                member.getRemainingQuota());
    }

    public static List<MemberResponse> toMembers(List<Member> members) {
        return members.stream().map(DtoMapper::toMember).toList();
    }

    public static LoanResponse toLoan(id.pens.simpustaka.domain.Loan loan, boolean active) {
        Member member = loan.getMember();
        Book book = loan.getBook();
        return new LoanResponse(
                loan.getId(),
                member.getId(),
                member.getName(),
                member.getCategoryLabel(),
                book.getId(),
                book.getTitle(),
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getStatus(),
                active,
                loan.getLateDays(),
                loan.getFine(),
                member.getFineRatePerDay(),
                member.getLoanPeriodDays());
    }

    public static List<LoanResponse> toLoans(List<id.pens.simpustaka.domain.Loan> loans) {
        return loans.stream().map(loan -> toLoan(loan, !loan.isReturned())).toList();
    }

    /** Ringkasan aturan sirkulasi tiap kategori anggota, ditampilkan pada antarmuka. */
    public static MemberRuleResponse toRule(MemberType type, int quota, int periodDays, long fineRate) {
        return new MemberRuleResponse(type, type.getLabel(), quota, periodDays, fineRate);
    }
}
