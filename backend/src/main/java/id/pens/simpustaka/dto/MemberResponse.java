package id.pens.simpustaka.dto;

import id.pens.simpustaka.domain.MemberType;

/** Data anggota beserta aturan sirkulasi kategorinya untuk respons API. */
public record MemberResponse(
        String id,
        String name,
        String identityNumber,
        MemberType type,
        String categoryLabel,
        int loanQuota,
        int loanPeriodDays,
        long fineRatePerDay,
        int activeLoanCount,
        int remainingQuota) {
}
