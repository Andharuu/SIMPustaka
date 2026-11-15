package id.pens.simpustaka.domain;

/**
 * Enum kategori anggota perpustakaan.
 *
 * <p>Batasan masalah menetapkan hanya dua kategori anggota yang didukung sistem.
 * Enum ini menjadi satu-satunya sumber kode kategori yang dikenali, baik pada
 * antarmuka, validasi input, maupun pembacaan berkas data.</p>
 */
public enum MemberType {

    STUDENT("Student", "Mahasiswa"),
    LECTURER("Lecturer", "Dosen");

    private final String code;
    private final String label;

    MemberType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /** Nama kelas domain yang merepresentasikan kategori ini. */
    public String getCode() {
        return code;
    }

    /** Label berbahasa Indonesia untuk tampilan. */
    public String getLabel() {
        return label;
    }

    /** Mencari kategori berdasarkan kode (tidak peka huruf besar/kecil). */
    public static MemberType fromCode(String value) {
        if (value != null) {
            for (MemberType type : values()) {
                if (type.code.equalsIgnoreCase(value.trim()) || type.name().equalsIgnoreCase(value.trim())) {
                    return type;
                }
            }
        }
        throw new id.pens.simpustaka.exception.ValidationException(
                "Kategori anggota tidak dikenal: " + value + " (hanya Student atau Lecturer)");
    }
}
