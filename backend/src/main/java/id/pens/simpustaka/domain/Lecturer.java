package id.pens.simpustaka.domain;

/**
 * Anggota kategori Dosen.
 *
 * <p>Menerapkan <b>Inheritance</b> dari {@link Member} dan <b>Polymorphism</b> melalui
 * Method Overriding pada aturan sirkulasi: kuota 5 buku, durasi pinjam 14 hari,
 * denda Rp2.000 per hari keterlambatan.</p>
 */
public class Lecturer extends Member {

    public static final int LOAN_QUOTA = 5;
    public static final int LOAN_PERIOD_DAYS = 14;
    public static final long FINE_RATE_PER_DAY = 2_000L;

    public Lecturer(String id, String name, String nip) {
        super(id, name, nip);
    }

    @Override
    public MemberType getType() {
        return MemberType.LECTURER;
    }

    @Override
    public int getLoanQuota() {
        return LOAN_QUOTA;
    }

    @Override
    public int getLoanPeriodDays() {
        return LOAN_PERIOD_DAYS;
    }

    @Override
    public long getFineRatePerDay() {
        return FINE_RATE_PER_DAY;
    }
}
