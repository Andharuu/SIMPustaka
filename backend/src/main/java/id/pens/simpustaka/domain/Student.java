package id.pens.simpustaka.domain;

/**
 * Anggota kategori Mahasiswa.
 *
 * <p>Menerapkan <b>Inheritance</b> dari {@link Member} dan <b>Polymorphism</b> melalui
 * Method Overriding pada aturan sirkulasi: kuota 3 buku, durasi pinjam 7 hari,
 * denda Rp1.000 per hari keterlambatan.</p>
 */
public class Student extends Member {

    public static final int LOAN_QUOTA = 3;
    public static final int LOAN_PERIOD_DAYS = 7;
    public static final long FINE_RATE_PER_DAY = 1_000L;

    public Student(String id, String name, String nim) {
        super(id, name, nim);
    }

    @Override
    public MemberType getType() {
        return MemberType.STUDENT;
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
