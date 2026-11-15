package id.pens.simpustaka.dto;

import id.pens.simpustaka.domain.MemberType;

/** Aturan sirkulasi per kategori anggota (kuota, durasi pinjam, tarif denda). */
public record MemberRuleResponse(
        MemberType type,
        String label,
        int loanQuota,
        int loanPeriodDays,
        long fineRatePerDay) {
}
