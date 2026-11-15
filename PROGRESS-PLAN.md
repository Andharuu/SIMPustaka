# Progress Plan — SIMPustaka

Dokumen ini adalah **papan kendali proyek**: memetakan setiap syarat dari
`INSTRUKSI FINAL PROJECT PBO` terhadap kondisi nyata sistem, menandai yang sudah
beres dan yang belum, serta mencatat tindakan berikutnya.

> **Aturan pemeliharaan:** dokumen ini diperbarui **setiap kali** ada perubahan
> sistem, penambahan dokumen, atau perubahan status pekerjaan. Bagian
> [Log Pembaruan](#7-log-pembaruan) wajib ditambah barisnya.

**Terakhir diperbarui:** 2026-11-15

---

## Daftar Isi

1. [Ringkasan Status](#1-ringkasan-status)
2. [Kepatuhan Spesifikasi Fungsional](#2-kepatuhan-spesifikasi-fungsional)
3. [Kepatuhan Spesifikasi OOP](#3-kepatuhan-spesifikasi-oop)
4. [Kepatuhan Output Wajib](#4-kepatuhan-output-wajib)
5. [Progres per Tahapan 4 Minggu](#5-progres-per-tahapan-4-minggu)
6. [Gap dan Rencana Tindakan](#6-gap-dan-rencana-tindakan)
7. [Log Pembaruan](#7-log-pembaruan)

---

## 1. Ringkasan Status

| Aspek | Status | Keterangan |
|---|---|---|
| **Source code (Java)** | ✅ Selesai | 30 berkas Java, 18 unit test lulus |
| **Spesifikasi fungsional (A)** | ✅ 7/7 terpenuhi | Diuji langsung ke API berjalan |
| **Spesifikasi OOP (B)** | ✅ 9/9 terpenuhi | Dibuktikan dengan nomor baris kode |
| **Laporan BAB I–II** | ✅ Ada | Dari laporan progres |
| **Laporan BAB III–V** | ❌ Belum ada | Prioritas tertinggi |
| **Video demonstrasi** | ❌ Belum ada | Wajib, 5–10 menit |
| **Presentasi & tanya jawab** | ⏳ Persiapan | Bahan ada di `BAHAN-BELAJAR.md` |

**Skor kepatuhan teknis: 16/16 (100%)** untuk seluruh syarat implementasi.
Yang belum lengkap adalah **dokumen dan media**, bukan program.

### Catatan penting yang harus dikonfirmasi ke dosen

| Hal | Isi instruksi | Kondisi kita | Tindakan |
|---|---|---|---|
| Bentuk antarmuka | "Console **atau** GUI" | GUI berbasis web (React) | Konfirmasi: web termasuk GUI. Laporan awal menyebut Java Swing. |
| Judul proyek | Pilih dari 10 tema | Tema #1 Library Management System | Sudah sesuai |

---

## 2. Kepatuhan Spesifikasi Fungsional

Instruksi Bagian 5.A — "Aplikasi minimal memiliki:" — diuji langsung ke API
yang berjalan pada 2026-11-15.

| # | Syarat | Status | Bukti |
|---|---|---|---|
| 1 | Pengelolaan data (tambah, tampil, ubah, hapus) | ✅ | `POST/PUT/GET/DELETE /api/books` dan `/api/members`; diuji: 201 → 200 → 204, data benar berubah dan terhapus |
| 2 | Pencarian data | ✅ | `GET /api/books?q=basis` → 14 hasil; `GET /api/members?q=aulia` → 1 hasil |
| 3 | Proses utama sesuai studi kasus | ✅ | Peminjaman + pengembalian: jatuh tempo 2026-11-22 (pinjam 15 Nov + 7 hari), stok 3→2 saat pinjam, 2→3 saat kembali, kuota pulih |
| 4 | Validasi input | ✅ | Stok negatif, judul kosong, ID duplikat, kategori tidak dikenal → semuanya ditolak `400` |
| 5 | Penyimpanan dan pembacaan data | ✅ | `data/perpustakaan.csv` (100 buku, 30 anggota, 33 transaksi); dimuat ulang saat start |
| 6 | Penanganan kesalahan program | ✅ | `404 NOT_FOUND`, `400 VALIDATION_ERROR`, `500 STORAGE_ERROR` dengan pesan berbahasa Indonesia |
| 7 | File Handling atau Database | ✅ | File Handling (`FileDataManager`) dengan tulis atomik |

---

## 3. Kepatuhan Spesifikasi OOP

Instruksi Bagian 5.B — sembilan konsep wajib. Kolom bukti memuat berkas dan
nomor baris agar bisa langsung ditunjukkan saat dosen meminta.

| # | Konsep | Syarat instruksi | Status | Bukti di kode |
|---|---|---|---|---|
| 1 | **Class dan Object** | Min. 5 class saling berinteraksi | ✅ **9 class inti** | `Book`, `Member`, `Student`, `Lecturer`, `Loan`, `MemberType`, `LibraryManager`, `DataManager`, `FileDataManager` |
| 2 | **Constructor** | Dengan parameter | ✅ | `Book(id,title,author,category,stock)`, `Loan(id,member,book,loanDate)`, `Student(id,name,nim)`, `Lecturer(id,name,nip)` |
| 3 | **Encapsulation** | Atribut private + getter/setter | ✅ | `Book.java`: 6 field private, 6 getter, 4 setter; `Loan.java`: 9 field private |
| 4 | **Inheritance** | Min. 1 hubungan pewarisan | ✅ **2 pewarisan** | `Student extends Member` (`Student.java:10`), `Lecturer extends Member` (`Lecturer.java:10`) |
| 5 | **Polymorphism** | Method overriding / interface polimorfik | ✅ **8 override** | 4 `@Override` di `Student.java`, 4 di `Lecturer.java` — plus `DataManager` dipakai polimorfik |
| 6 | **Abstraction** | Min. 1 abstract class atau interface | ✅ **keduanya** | `public abstract class Member` (`Member.java:20`), `public interface DataManager` (`DataManager.java:17`) |
| 7 | **Exception Handling** | try-catch + penanganan sesuai | ✅ | 6 blok `try`, 38 `throw new`, 3 exception khusus, handler terpusat `@RestControllerAdvice` (`ApiExceptionHandler.java:27`) |
| 8 | **Collection** | ArrayList / Collection Framework | ✅ | 3 `ArrayList` di `LibraryManager.java:43-45` |
| 9 | **File Handling** | Simpan & baca file / database | ✅ | `Files.writeString` + `Files.move` atomik (`FileDataManager.java:99-103`), `Files.readAllLines` (baris 118) |

### Peringatan instruksi yang perlu dijawab

> *"Mahasiswa tidak diperkenankan hanya menambahkan konsep OOP untuk memenuhi
> persyaratan tanpa memahami fungsi dan alasan penggunaannya."*

Antisipasi jawaban (detail di `BAHAN-BELAJAR.md` §6):

- **Inheritance** dipakai karena Mahasiswa dan Dosen berbagi 90% data (id, nama,
  NIM/NIP) tetapi berbeda aturan sirkulasi. Tanpa pewarisan, data itu ditulis dua kali.
- **Polymorphism** dipakai agar `LibraryManager` tidak perlu `if (member instanceof Student)`.
  Satu baris `member.getLoanQuota()` bekerja benar untuk kedua kategori.
- **Abstraction** dipakai karena `Member` tidak boleh diinstansiasi langsung —
  setiap anggota wajib punya kategori yang jelas.

---

## 4. Kepatuhan Output Wajib

Instruksi Bagian 7.

### A. Source Code — ✅

| Syarat | Status | Keterangan |
|---|---|---|
| Seluruh source code Java | ✅ | `backend/src/main/java/` — 30 berkas |
| Struktur folder terorganisasi | ✅ | Berlapis: `domain/`, `data/`, `manager/`, `dto/`, `exception/`, `web/` |
| File pendukung | ✅ | `mvnw`, `pom.xml`, `application.yml`, `package.json`, `vite.config.js`, `README.md` |

### B. Laporan Final Project — ⚠️ 2 dari 5 BAB

| BAB | Isi yang diminta | Status |
|---|---|---|
| **BAB I** Pendahuluan | Latar belakang, rumusan masalah, tujuan, batasan | ✅ Ada |
| **BAB II** Analisis & Perancangan | Deskripsi sistem, kebutuhan fungsional, Use Case, Class Diagram, penjelasan kelas | ✅ Ada |
| **BAB III** Implementasi | Lingkungan pengembangan, struktur program, implementasi class/object, Encapsulation, Inheritance, Polymorphism, Abstraction, Exception + Collection | ❌ **BELUM** |
| **BAB IV** Pengujian & Hasil | Skenario pengujian, hasil, screenshot, analisis | ❌ **BELUM** |
| **BAB V** Kesimpulan | Kesimpulan, kendala, saran pengembangan | ❌ **BELUM** |

### C. Video Demonstrasi — ❌ BELUM

Durasi 5–10 menit, harus memperlihatkan: penjelasan singkat aplikasi, demonstrasi
fitur utama, contoh penggunaan, penjelasan penerapan OOP.

### D. Presentasi — ⏳ Persiapan

Bahan sudah tersedia di `BAHAN-BELAJAR.md` (33 pertanyaan + jawaban).

---

## 5. Progres per Tahapan 4 Minggu

Instruksi Bagian 6.

### Minggu 1 — Analisis dan Perancangan Sistem — ✅ Selesai

- [x] Menentukan judul dan studi kasus (Library Management System)
- [x] Mengidentifikasi permasalahan
- [x] Menentukan kebutuhan fungsional (FR-01 s.d. FR-11)
- [x] Menentukan aktor dan proses bisnis (Petugas Perpustakaan)
- [x] Membuat UML Use Case Diagram
- [x] Membuat UML Class Diagram
- [x] Menentukan pembagian tugas anggota kelompok

### Minggu 2 — Implementasi Konsep OOP — ✅ Selesai

- [x] Membuat struktur project Java
- [x] Membuat class dan object
- [x] Mengimplementasikan constructor dan encapsulation
- [x] Mengimplementasikan inheritance
- [x] Mengimplementasikan polymorphism
- [x] Mengimplementasikan abstraction
- [x] Mengembangkan logika utama aplikasi

### Minggu 3 — Pengembangan dan Integrasi — ✅ Selesai

- [x] Mengembangkan fitur-fitur aplikasi (CRUD, pencarian, transaksi)
- [x] Membuat antarmuka aplikasi
- [x] Mengimplementasikan Collection Framework
- [x] Mengimplementasikan File Handling
- [x] Mengimplementasikan Exception Handling
- [x] Melakukan integrasi antarkelas
- [x] Melakukan pengujian awal dan debugging

### Minggu 4 — Pengujian dan Finalisasi — ⏳ Sebagian

- [x] Melakukan pengujian keseluruhan aplikasi (18 unit test + uji API + uji UI)
- [x] Memperbaiki kesalahan program
- [ ] Menyelesaikan dokumentasi (BAB III–V)
- [ ] Membuat video demonstrasi
- [ ] Menyiapkan presentasi
- [ ] Demonstrasi dan tanya jawab dengan dosen

---

## 6. Gap dan Rencana Tindakan

Diurutkan berdasarkan bobot penilaian (Bagian 8 instruksi).

| Prioritas | Gap | Bobot terdampak | Tindakan | Status |
|---|---|---|---|---|
| **P1** | BAB III Implementasi belum ada | Dokumentasi 10% | Tulis dari kode nyata: lingkungan, struktur, 4 pilar OOP dengan potongan kode | ⬜ Belum |
| **P1** | BAB IV Pengujian belum ada | Dokumentasi 10% | Ambil 18 unit test + skenario manual sebagai bukti, sertakan screenshot | ⬜ Belum |
| **P1** | BAB V Kesimpulan belum ada | Dokumentasi 10% | Ringkas capaian per FR + kendala + saran | ⬜ Belum |
| **P2** | Video demonstrasi belum ada | Presentasi 10% | Rekam 5–10 menit mengikuti alur di `BAHAN-BELAJAR.md` | ⬜ Belum |
| **P3** | Konfirmasi bentuk antarmuka (web vs Swing) | Risiko administrasi | Tanyakan ke dosen sebelum pengumpulan | ⬜ Belum |
| **P4** | Latihan live coding | Pemahaman individu 10% | Kuasai 5 perubahan kecil (lihat di bawah) | ⬜ Belum |

### Latihan live coding yang paling mungkin diminta

Instruksi Bagian 9: *"Dosen dapat memberikan tantangan perubahan kode sederhana."*

| Tantangan | Berkas yang diubah | Perkiraan usaha |
|---|---|---|
| Ubah tarif denda Mahasiswa | `Student.java` — konstanta `FINE_RATE_PER_DAY` | 1 baris |
| Ubah durasi pinjam Dosen | `Lecturer.java` — konstanta `LOAN_PERIOD_DAYS` | 1 baris |
| Ubah kuota Mahasiswa | `Student.java` — konstanta `LOAN_QUOTA` | 1 baris |
| Tambah kategori anggota baru (mis. Umum) | `MemberType.java` + kelas baru + `LibraryManager.instantiateMember` | ~3 berkas |
| Tambah field pada buku (mis. tahun terbit) | `Book.java` + `BookRequest`/`BookResponse` + form | ~5 berkas |

Cara menjawabnya ada di `BAHAN-BELAJAR.md` §12.

---

## 7. Log Pembaruan

| Tanggal | Perubahan | Dampak pada dokumen ini |
|---|---|---|
| 2026-11-15 | Dokumen dibuat; audit menyeluruh terhadap `INSTRUKSI FINAL PROJECT PBO` | Seluruh bagian |
| 2026-11-15 | Verifikasi: 9/9 konsep OOP + 7/7 spesifikasi fungsional lulus uji | §2, §3 |
| 2026-11-15 | Teridentifikasi gap: BAB III–V, video, presentasi belum ada | §4, §6 |

---

*Dokumen ini adalah alat kerja, bukan formalitas. Perbarui statusnya setiap kali
ada yang berubah — jangan biarkan tabel di atas berbohong.*
