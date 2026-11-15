package id.pens.simpustaka.domain;

import id.pens.simpustaka.exception.ValidationException;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Kelas abstrak Member — induk dari seluruh kategori anggota perpustakaan.
 *
 * <p>Menerapkan <b>Abstraction</b> melalui method abstrak {@link #getLoanQuota()},
 * {@link #getLoanPeriodDays()}, dan {@link #getFineRatePerDay()} yang wajib
 * diimplementasikan oleh setiap kategori anggota. Menerapkan <b>Encapsulation</b>
 * dengan atribut private/protected dan akses melalui getter/setter tervalidasi.</p>
 *
 * <p>Kategori anggota bersifat tetap sesuai batasan masalah: hanya Student (Mahasiswa)
 * dan Lecturer (Dosen).</p>
 */
public abstract class Member {

    protected final String id;
    protected String name;
    /** Nomor identitas keanggotaan: NIM untuk Mahasiswa, NIP untuk Dosen. */
    protected String identityNumber;
    private final Set<String> activeLoanIds = new LinkedHashSet<>();

    protected Member(String id, String name, String identityNumber) {
        if (id == null || id.isBlank()) {
            throw new ValidationException("ID anggota wajib diisi");
        }
        this.id = id.trim();
        setName(name);
        setIdentityNumber(identityNumber);
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("Nama anggota wajib diisi");
        }
        this.name = name.trim();
    }

    public String getIdentityNumber() {
        return identityNumber;
    }

    public void setIdentityNumber(String identityNumber) {
        if (identityNumber == null || identityNumber.isBlank()) {
            throw new ValidationException("Nomor identitas anggota wajib diisi");
        }
        this.identityNumber = identityNumber.trim();
    }

    // ---------------------------------------------------------------------
    // Method abstrak — aturan sirkulasi berbeda per kategori (Polymorphism)
    // ---------------------------------------------------------------------

    /** Kode kategori anggota yang disimpan pada berkas data (STUDENT / LECTURER). */
    public abstract MemberType getType();

    /** Kuota maksimal buku yang boleh dipinjam bersamaan. */
    public abstract int getLoanQuota();

    /** Durasi peminjaman dalam hari, dipakai untuk menghitung jatuh tempo (FR-05). */
    public abstract int getLoanPeriodDays();

    /** Tarif denda keterlambatan per hari (FR-07). */
    public abstract long getFineRatePerDay();

    // ---------------------------------------------------------------------
    // Perilaku umum anggota
    // ---------------------------------------------------------------------

    /** Jumlah buku yang sedang dipinjam dan belum dikembalikan. */
    public int getActiveLoanCount() {
        return activeLoanIds.size();
    }

    public Set<String> getActiveLoanIds() {
        return Collections.unmodifiableSet(activeLoanIds);
    }

    public void addActiveLoan(String loanId) {
        if (loanId == null || loanId.isBlank()) {
            throw new ValidationException("ID transaksi wajib diisi");
        }
        activeLoanIds.add(loanId);
    }

    public void removeActiveLoan(String loanId) {
        activeLoanIds.remove(loanId);
    }

    public int getRemainingQuota() {
        return Math.max(0, getLoanQuota() - getActiveLoanCount());
    }

    /**
     * Menghitung denda keterlambatan berdasarkan tarif kategori anggota.
     *
     * @param lateDays jumlah hari keterlambatan (0 bila tidak terlambat)
     * @return total denda rupiah
     */
    public long calculateFine(int lateDays) {
        if (lateDays <= 0) {
            return 0L;
        }
        return getFineRatePerDay() * lateDays;
    }

    /** Label kategori untuk ditampilkan pada antarmuka pengguna. */
    public String getCategoryLabel() {
        return getType().getLabel();
    }

    @Override
    public String toString() {
        return "Member{id='" + id + "', name='" + name + "', type=" + getType() + '}';
    }
}
