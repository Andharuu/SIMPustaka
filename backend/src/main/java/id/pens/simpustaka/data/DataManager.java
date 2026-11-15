package id.pens.simpustaka.data;

import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.domain.Member;

import java.util.List;

/**
 * Kontrak penyimpanan dan pembacaan data permanen (FR-09 dan FR-10).
 *
 * <p>Merupakan bentuk <b>Abstraction</b> pada lapisan penyimpanan: kelas
 * {@link id.pens.simpustaka.manager.LibraryManager} hanya bergantung pada interface
 * ini, sehingga mekanisme penyimpanan (File Handling maupun database lokal) dapat
 * diganti tanpa mengubah logika bisnis.</p>
 */
public interface DataManager {

    /** Menyimpan seluruh data buku, anggota, dan transaksi secara permanen. */
    void saveData(List<Book> books, List<Member> members, List<Loan> loans);

    /** Membaca kembali data yang tersimpan; mengembalikan data kosong bila belum ada berkas. */
    LibrarySnapshot loadData();
}
