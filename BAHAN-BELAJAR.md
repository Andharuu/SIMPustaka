# Bahan Belajar SIMPustaka

Dokumen ini adalah **bahan belajar dan persiapan sidang/tanya-jawab** untuk proyek
SIMPustaka. Isinya menjelaskan *mengapa* sistem dibangun seperti ini, bukan cuma
*apa* yang ada di dalamnya — karena pertanyaan dosen hampir selalu berbentuk "kenapa".

> **Cara pakai:** baca Bagian 1–5 untuk memahami sistem, lalu lompat ke
> **Bagian 12 (Bank Pertanyaan Dosen)** sebelum presentasi. Bagian itu berisi
> pertanyaan yang paling mungkin muncul beserta jawabannya.

**Status dokumen:** diperbarui setiap kali ada perubahan pada sistem.

---

## Daftar Isi

1. [Ringkasan 30 Detik](#1-ringkasan-30-detik)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Peta Berkas dan Tanggung Jawab](#3-peta-berkas-dan-tanggung-jawab)
4. [Aturan Bisnis](#4-aturan-bisnis)
5. [Alur Proses Lengkap](#5-alur-proses-lengkap)
6. [Empat Pilar OOP di Dalam Kode](#6-empat-pilar-oop-di-dalam-kode)
7. [Collection Framework](#7-collection-framework)
8. [Exception Handling](#8-exception-handling)
9. [File Handling dan Penyimpanan Permanen](#9-file-handling-dan-penyimpanan-permanen)
10. [REST API](#10-rest-api)
11. [Frontend React](#11-frontend-react)
12. [Bank Pertanyaan Dosen](#12-bank-pertanyaan-dosen)
13. [Keterbatasan yang Diakui](#13-keterbatasan-yang-diakui)
14. [Glosarium](#14-glosarium)
15. [Log Pembaruan](#15-log-pembaruan)

---

## 1. Ringkasan 30 Detik

SIMPustaka adalah aplikasi pengelolaan perpustakaan untuk **satu aktor: Petugas
Perpustakaan**. Petugas mengelola koleksi buku, data anggota, dan melayani
transaksi peminjaman serta pengembalian.

Nilai jual teknisnya: **aturan sirkulasi berbeda per kategori anggota tidak ditulis
sebagai `if` di banyak tempat**, melainkan menjadi perilaku objek. Mahasiswa dan
Dosen adalah dua kelas berbeda yang mewarisi satu kelas abstrak `Member`, dan
masing-masing mendefinisikan ulang kuota, durasi pinjam, serta tarif dendanya.

Kalau ditanya "sistem ini apa", jawab:

> "Sistem manajemen perpustakaan berbasis Java yang memisahkan aturan bisnis ke
> dalam kelas domain berorientasi objek, dengan penyimpanan permanen berbasis file,
> dan antarmuka web React yang mengonsumsi REST API."

---

## 2. Arsitektur Sistem

### Bentuk umum

```
┌─────────────────────────────┐
│  Browser (React 19 + Vite)  │   port 5173
│  Halaman, tabel, form       │
└──────────────┬──────────────┘
               │  HTTP JSON  (/api/...)
               │  di-proxy oleh Vite
┌──────────────▼──────────────┐
│  Backend Java Spring Boot   │   port 8080
│  ┌───────────────────────┐  │
│  │ web/    Controller    │  │  menerima HTTP, memvalidasi bentuk data
│  ├───────────────────────┤  │
│  │ dto/    Request/Resp  │  │  kontrak JSON, memisahkan domain dari HTTP
│  ├───────────────────────┤  │
│  │ manager/LibraryManager│ │  aturan bisnis, validasi, ArrayList
│  ├───────────────────────┤  │
│  │ domain/ Book, Member, │  │  OOP murni, tanpa import framework
│  │         Student, ...  │  │
│  ├───────────────────────┤  │
│  │ data/   DataManager   │  │  interface + implementasi file
│  └───────────────────────┘  │
└──────────────┬──────────────┘
               │
        data/perpustakaan.csv
```

### Kenapa berlapis (layered)?

Karena setiap lapisan punya satu alasan untuk berubah:

| Lapisan | Berubah kalau... |
|---|---|
| `domain/` | aturan bisnis berubah (mis. denda naik) |
| `data/` | cara menyimpan berubah (file → database) |
| `web/` | bentuk API berubah |
| `dto/` | kontrak data dengan frontend berubah |

Kalau semuanya digabung dalam satu kelas, perubahan kecil di satu tempat bisa
merusak bagian lain. Pemisahan ini yang membuat sistem **maintainable**.

**Bukti penting:** folder `domain/` **tidak meng-import apa pun dari Spring**. Buka
`Book.java` — hanya ada `import id.pens.simpustaka.exception.ValidationException`.
Artinya kelas domain bisa dipakai ulang untuk aplikasi desktop (Java Swing), CLI,
atau framework lain tanpa diubah. Ini juga jawaban kalau dosen bertanya soal
perbedaan dengan Java Swing di laporan.

---

## 3. Peta Berkas dan Tanggung Jawab

### Backend

| Berkas | Tanggung jawab | Catatan untuk sidang |
|---|---|---|
| `domain/Book.java` | Data buku + stok | Encapsulation: semua field `private`, akses lewat getter/setter tervalidasi |
| `domain/Member.java` | Kelas **abstrak** anggota | Punya 4 method abstrak; mendefinisikan kontrak aturan sirkulasi |
| `domain/Student.java` | Mahasiswa | Override: kuota 3, 7 hari, Rp1.000 |
| `domain/Lecturer.java` | Dosen | Override: kuota 5, 14 hari, Rp2.000 |
| `domain/MemberType.java` | Enum kategori | Membatasi kategori hanya dua, sesuai batasan masalah |
| `domain/Loan.java` | Transaksi peminjaman | Menghitung jatuh tempo di constructor, denda saat `processReturn()` |
| `data/DataManager.java` | **Interface** penyimpanan | Abstraction: kontrak `saveData` / `loadData` |
| `data/FileDataManager.java` | Implementasi file | Baca/tulis CSV, escape karakter, tulis atomik |
| `data/LibrarySnapshot.java` | Hasil muat data | Immutable (`List.copyOf`) |
| `manager/LibraryManager.java` | Operasional + validasi | `ArrayList`, semua method `synchronized` |
| `manager/LibraryStats.java` | Ringkasan dasbor | Java `record` |
| `dto/*` | Kontrak JSON | Memisahkan objek domain dari bentuk HTTP |
| `exception/*` | 3 exception khusus | `ValidationException`, `NotFoundException`, `DataAccessException` |
| `web/*Controller.java` | Endpoint REST | Tipis — hanya menerjemahkan HTTP ke pemanggilan manager |
| `web/ApiExceptionHandler.java` | Penanganan error terpusat | `@RestControllerAdvice` |
| `SIMPustakaApplication.java` | Titik masuk | Memuat data saat aplikasi siap |

### Frontend

| Berkas | Tanggung jawab |
|---|---|
| `App.jsx` | Kerangka: sidebar, topbar, routing |
| `lib/api.js` | Semua `fetch` ke backend + kelas `ApiError` |
| `lib/sort.js` | Hook `useSortable` untuk pengurutan tabel |
| `lib/hooks.js` | `useCountUp` (animasi angka), `useDeferredLoading` |
| `components/Select.jsx` | Combobox kustom (pengganti `<select>`) |
| `components/SearchCommand.jsx` | Pencarian global di topbar |
| `components/SortHeader.jsx` | Sel kepala tabel yang bisa diklik untuk sortir |
| `components/BookCard.jsx` | Kartu buku untuk tampilan galeri |
| `pages/*.jsx` | Satu halaman per kebutuhan fungsional |

---

## 4. Aturan Bisnis

### Tabel ketentuan

| Kategori | Kelas | Kuota | Durasi pinjam | Denda / hari |
|---|---|---|---|---|
| Mahasiswa | `Student` | 3 buku | 7 hari | Rp1.000 |
| Dosen | `Lecturer` | 5 buku | 14 hari | Rp2.000 |

Angka-angka ini **hanya didefinisikan di satu tempat** — sebagai konstanta di
`Student.java` dan `Lecturer.java`:

```java
// Student.java
public static final int LOAN_QUOTA = 3;
public static final int LOAN_PERIOD_DAYS = 7;
public static final long FINE_RATE_PER_DAY = 1_000L;
```

### Siapa yang menghitung apa

| Perhitungan | Dilakukan oleh | Method |
|---|---|---|
| Tanggal jatuh tempo | `Loan` (constructor) | `loanDate.plusDays(member.getLoanPeriodDays())` |
| Hari keterlambatan | `Loan` | `calculateLateDays()` — `ChronoUnit.DAYS.between(dueDate, tanggalKembali)` |
| Besaran denda | `Member` | `calculateFine(lateDays)` → `getFineRatePerDay() * lateDays` |
| Validasi kuota | `LibraryManager` | `borrowBook()` |

**Poin penting untuk sidang:** denda dihitung oleh **objek anggota**, bukan oleh
`LibraryManager`. `LibraryManager` hanya bertanya `member.calculateFine(hari)`.
Karena `member` bisa berupa `Student` atau `Lecturer`, hasilnya otomatis berbeda.
Inilah **polymorphism** yang sebenarnya — bukan sekadar teori.

---

## 5. Alur Proses Lengkap

### 5.1 Alur peminjaman (`borrowBook`)

Urutan validasi — penting dihafal karena dosen sering menanyakan urutannya:

1. **Cari anggota** → kalau tidak ada: `NotFoundException` (HTTP 404)
2. **Cari buku** → kalau tidak ada: `NotFoundException` (HTTP 404)
3. **Cek stok** → kalau 0: `ValidationException` "Stok buku ... habis"
4. **Cek duplikasi** → anggota sama + buku sama + belum dikembalikan → ditolak
5. **Cek kuota** → `activeLoanCount >= getLoanQuota()` → ditolak
6. **Baru** membuat `Loan`, mengurangi stok, menambah daftar pinjaman aktif anggota
7. **Simpan** ke file (`persistSafely()`)

Kenapa urutannya begitu? Karena pesan kesalahan harus paling spesifik lebih dulu.
Kalau anggota tidak ada, tidak ada gunanya mengecek stok.

### 5.2 Alur pengembalian (`returnBook`)

1. Cari transaksi → kalau tidak ada: 404
2. Kalau sudah dikembalikan → `ValidationException` "sudah dikembalikan pada ..."
3. `loan.processReturn(tanggal)`:
   - tolak kalau tanggal kembali < tanggal pinjam
   - hitung `lateDays`
   - hitung `fine` lewat `member.calculateFine(lateDays)`
   - ubah status menjadi `RETURNED`
4. Stok buku **ditambah** 1
5. Anggota dihapus dari daftar pinjaman aktif (kuota kembali)
6. Simpan

### 5.3 Alur penyimpanan (setiap kali data berubah)

```
LibraryManager.addBook() → persistSafely() → FileDataManager.saveData()
   → tulis ke perpustakaan.csv.tmp → Files.move(tmp, target)
```

Ditulis ke file sementara dulu, **baru** diganti. Kalau proses mati di tengah
penulisan, file asli tetap utuh. Ini disebut **atomic write**.

### 5.4 Alur pembacaan (saat aplikasi start)

```
Spring siap → ApplicationReadyEvent → LibraryManager.loadFromStorage()
   → FileDataManager.loadData() → parsing 3 blok → LibrarySnapshot
```

Kalau file rusak: kesalahan dicatat di log, daftar dikosongkan, dan **aplikasi
tetap bisa dijalankan** (tidak crash). Petugas melihat galat, bukan layar mati.

---

## 6. Empat Pilar OOP di Dalam Kode

### 6.1 Encapsulation

**Arti:** data disembunyikan, hanya bisa diubah lewat pintu resmi yang tervalidasi.

**Di kode:**
```java
public class Book {
    private String id;        // tidak bisa diakses langsung dari luar
    private int stock;

    public void setStock(int stock) {
        if (stock < 0) {
            throw new ValidationException("Stok buku tidak boleh negatif");
        }
        this.stock = stock;
    }
}
```

**Kenapa penting:** stok tidak mungkin menjadi negatif, karena satu-satunya jalan
mengubahnya sudah menjaga. Ini yang membuat sistem aman meskipun nanti dipakai
dari antarmuka lain.

### 6.2 Inheritance

**Arti:** kelas anak mewarisi atribut dan perilaku kelas induk.

**Di kode:**
```java
public abstract class Member { ... }          // induk
public class Student extends Member { ... }   // anak
public class Lecturer extends Member { ... }  // anak
```

`Student` dan `Lecturer` **tidak menulis ulang** `id`, `name`, `identityNumber`,
`calculateFine()`, `addActiveLoan()` — semuanya diwarisi. Yang ditulis ulang hanya
yang memang berbeda: kuota, durasi, tarif.

### 6.3 Polymorphism

**Arti:** satu perintah, perilaku berbeda tergantung objek sebenarnya.

**Di kode:** Method Overriding pada 4 method abstrak.

```java
// Member.java (kontrak)
public abstract int getLoanQuota();

// Student.java
@Override public int getLoanQuota() { return LOAN_QUOTA; }   // 3

// Lecturer.java
@Override public int getLoanQuota() { return LOAN_QUOTA; }   // 5
```

**Bukti di `LibraryManager`** — tidak ada percabangan tipe sama sekali:

```java
if (member.getActiveLoanCount() >= member.getLoanQuota()) { ... }
```

Baris ini bekerja benar untuk kedua kategori tanpa `if (member instanceof Student)`.
Itulah tujuan polymorphism: **pemanggil tidak perlu tahu tipe objeknya.**

**Pertanyaan jebakan:** "Kalau overriding-nya dihapus, apa yang terjadi?"
Jawab: kode tidak bisa dikompilasi, karena `Member` abstrak dan method-nya belum
punya isi. Kalau dipaksa dengan menghapus `abstract`, semua anggota akan memakai
aturan yang sama dan sistem kehilangan fitur pembeda kategori.

### 6.4 Abstraction

**Arti:** menyembunyikan detail, hanya menampilkan yang penting.

Sistem ini memakai **dua bentuk abstraction yang berbeda** — sering ditanyakan:

| Bentuk | Dipakai untuk | Contoh | Alasan |
|---|---|---|---|
| **Abstract class** | Objek yang *adalah* sesuatu, punya state bersama | `Member` | Butuh menyimpan field (`id`, `name`) dan method konkret (`calculateFine`) |
| **Interface** | Kemampuan/kontrak yang bisa dimiliki banyak kelas | `DataManager` | Tidak butuh state, hanya kontrak `saveData`/`loadData` |

**Jawaban singkat kalau ditanya bedanya:**
> "Abstract class untuk hubungan *is-a* dan berbagi kode. Interface untuk kontrak
> *can-do*. `Student` adalah `Member` (is-a), sedangkan `FileDataManager` bisa
> menyimpan data (can-do) — nanti bisa ada `DatabaseDataManager` juga."

### 6.5 Constructor

Setiap objek wajib melewati constructor yang memvalidasi:

```java
public Loan(String id, Member member, Book book, LocalDate loanDate) {
    ...
    this.dueDate = this.loanDate.plusDays(member.getLoanPeriodDays());
    this.status = STATUS_BORROWED;
}
```

Perhatikan: **jatuh tempo tidak pernah dikirim dari luar**. Objek `Loan` menghitung
sendiri dari kategori anggotanya. Mustahil membuat transaksi dengan jatuh tempo
yang salah kategori.

---

## 7. Collection Framework

Sistem memakai **`ArrayList`** di `LibraryManager`:

```java
private final ArrayList<Book> books = new ArrayList<>();
private final ArrayList<Member> members = new ArrayList<>();
private final ArrayList<Loan> loans = new ArrayList<>();
```

### Kenapa ArrayList?

| Struktur | Kelebihan | Kekurangan | Cocok untuk |
|---|---|---|---|
| `ArrayList` | Akses indeks O(1), iterasi cepat, hemat memori | Sisip/hapus di tengah O(n) | Data yang lebih banyak dibaca daripada diubah |
| `LinkedList` | Sisip/hapus cepat | Akses lambat, memori lebih besar | Antrean, data yang sering diubah di tengah |
| `HashMap` | Pencarian O(1) | Urutan tidak terjaga | Pencarian berdasarkan kunci |

Kasus perpustakaan: operasi terbanyak adalah **membaca** (menampilkan daftar,
mencari) dan penambahan di akhir. Hapus di tengah jarang. Jadi `ArrayList` pilihan
tepat.

**Kalau dosen menantang:** "Kenapa tidak pakai `HashMap` untuk pencarian cepat?"
Jawab jujur:
> "Betul, untuk pencarian berdasarkan ID, `HashMap` lebih cepat O(1). Tapi laporan
> mensyaratkan `ArrayList`, dan jumlah data perpustakaan masih kecil sehingga
> pencarian linear masih memadai. Kalau data membesar, saya akan menambah
> `Map<String, Book>` sebagai indeks sambil tetap menyimpan `ArrayList` untuk urutan."

Jawaban seperti ini menunjukkan kamu paham trade-off, bukan sekadar mengikuti perintah.

### Di mana ArrayList dipakai untuk pencarian

`searchBooks()` dan `searchMembers()` melakukan iterasi linear dan mencocokkan
substring pada beberapa field sekaligus (ID, judul, penulis, kategori), tanpa
memperhatikan huruf besar/kecil.

---

## 8. Exception Handling

### Tiga exception khusus

| Exception | Kapan dilempar | HTTP |
|---|---|---|
| `ValidationException` | Input tidak valid, aturan bisnis dilanggar | 400 |
| `NotFoundException` | Data yang diminta tidak ada | 404 |
| `DataAccessException` | Gagal baca/tulis file, file rusak | 500 |

Ketiganya `extends RuntimeException` — artinya **unchecked exception**.

### Kenapa unchecked, bukan checked?

Checked exception memaksa setiap pemanggil menulis `try-catch` atau `throws`,
termasuk di controller, yang membuat kode penuh boilerplate. Karena sistem punya
**penanganan terpusat** di `ApiExceptionHandler`, pemanggil tidak perlu menangani
satu per satu.

> Jawaban sidang: "Saya pakai unchecked karena penanganannya terpusat di satu
> tempat (`@RestControllerAdvice`). Kalau checked, setiap lapisan harus
> mendeklarasikan `throws` dan itu tidak menambah keamanan apa pun di sini."

### Penanganan terpusat

`ApiExceptionHandler` menerjemahkan exception menjadi JSON konsisten:

```json
{
  "timestamp": "2026-11-15T12:40:54.557Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Kuota peminjaman Mahasiswa tercapai (maksimal 3 buku)"
}
```

Frontend cukup membaca `message` dan menampilkannya. Tidak perlu menebak bentuk error.

### try-catch di lapisan file

`FileDataManager` membungkus semua operasi I/O:

```java
try {
    Files.createDirectories(dataDirectory);
    Files.writeString(temp, out.toString(), StandardCharsets.UTF_8);
    Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
} catch (IOException e) {
    throw new DataAccessException("Gagal menyimpan data ke " + target.toAbsolutePath(), e);
}
```

Perhatikan parameter kedua: **exception asli disimpan sebagai `cause`**. Jadi
informasi teknis tidak hilang, tapi lapisan atas menerima exception yang bermakna.

---

## 9. File Handling dan Penyimpanan Permanen

### Format berkas

`backend/data/perpustakaan.csv`, UTF-8, pemisah `;`, tiga blok:

```
# SIMPustaka data file
[BOOK]
B-001;Algoritma dan Pemrograman;Rinaldi Munir;Informatika;4

[MEMBER]
STUDENT;A-001;Aulia Rahmawati;3125521001
LECTURER;A-021;Dr. Bambang Setiawan, M.Kom.;197803122003121001

[LOAN]
TRX-20261026-0001;A-001;B-001;2026-10-26;2026-11-02;;0;0;BORROWED
```

Kolom `[LOAN]`: ID, ID anggota, ID buku, tanggal pinjam, jatuh tempo, tanggal
kembali, denda, hari terlambat, status.

### Tiga hal teknis yang layak disebut saat sidang

**1. Escaping.** Kalau judul buku mengandung `;`, file akan rusak. Karena itu
karakter `;` dan `\` di-escape sebelum ditulis, dan di-unescape saat dibaca.

**2. Atomic write.** Ditulis ke `.tmp` dulu, lalu `Files.move(..., REPLACE_EXISTING)`.
Kalau aplikasi mati di tengah penulisan, file lama tidak rusak.

**3. Validasi saat memuat.** `loadData()` memeriksa:
- jumlah kolom tiap baris harus tepat
- anggota dan buku yang dirujuk transaksi harus ada
- **tanggal jatuh tempo yang tersimpan harus sama dengan hasil hitung ulang** dari
  kategori anggota. Kalau berbeda, file dianggap tidak konsisten dan ditolak.

Poin ketiga sering membuat dosen terkesan, karena itu berarti sistem tidak
mempercayai begitu saja isi file.

### Kenapa file, bukan database?

Batasan masalah mengizinkan "File Handling **atau** database lokal". File dipilih
karena:
- tidak perlu instalasi server database
- mudah diperiksa manual (bisa dibuka di Notepad)
- cukup untuk skala satu perpustakaan

Dan karena `DataManager` adalah **interface**, mengganti ke database hanya perlu
membuat kelas baru `DatabaseDataManager implements DataManager` — `LibraryManager`
tidak perlu diubah sama sekali.

---

## 10. REST API

| Metode | Endpoint | Fungsi | FR |
|---|---|---|---|
| GET | `/api/books?q=` | Daftar / cari buku | FR-01, FR-03 |
| POST | `/api/books` | Tambah buku | FR-01 |
| PUT | `/api/books/{id}` | Ubah buku | FR-01 |
| DELETE | `/api/books/{id}` | Hapus buku | FR-01 |
| GET | `/api/members?q=` | Daftar / cari anggota | FR-02, FR-03 |
| GET | `/api/members/rules` | Aturan sirkulasi per kategori | FR-02 |
| POST | `/api/members` | Tambah anggota | FR-02 |
| PUT | `/api/members/{id}` | Ubah anggota | FR-02 |
| DELETE | `/api/members/{id}` | Hapus anggota | FR-02 |
| GET | `/api/loans?active=true` | Riwayat / pinjaman aktif | FR-08 |
| POST | `/api/loans` | Catat peminjaman | FR-04, FR-05 |
| POST | `/api/loans/{id}/return` | Catat pengembalian | FR-06, FR-07 |
| GET | `/api/dashboard/stats` | Statistik dasbor | — |

### Contoh peminjaman

Permintaan:
```json
POST /api/loans
{ "memberId": "A-001", "bookId": "B-001", "loanDate": "2026-11-10" }
```

Respons `201 Created`:
```json
{
  "id": "TRX-20261110-0001",
  "memberName": "Aulia Rahmawati",
  "memberCategory": "Mahasiswa",
  "bookTitle": "Algoritma dan Pemrograman",
  "loanDate": "2026-11-10",
  "dueDate": "2026-11-17",
  "status": "BORROWED",
  "loanPeriodDays": 7,
  "fineRatePerDay": 1000
}
```

Perhatikan `dueDate` = `loanDate + 7` **dihitung server**, bukan dikirim frontend.

### Kenapa ada DTO, tidak langsung kirim objek domain?

Kalau `Book` dikirim langsung sebagai JSON:
- field `private` tetap bisa bocor lewat serialisasi
- bentuk JSON terikat pada struktur internal — ganti nama field di kelas merusak API
- relasi antar objek bisa membuat JSON berulang tanpa akhir (`Loan` → `Member` → daftar `Loan`)

DTO memutus ketergantungan itu. `DtoMapper` yang mengubah domain → DTO.

---

## 11. Frontend React

### Struktur

- **Routing** dengan `react-router-dom`. Setiap halaman dibungkus `<div className="page" key={location.pathname}>`
  supaya animasi masuk berjalan ulang setiap pindah halaman.
- **State** memakai hook bawaan (`useState`, `useEffect`, `useMemo`, `useCallback`).
  Tidak ada state library seperti Redux karena skala aplikasi tidak membutuhkannya.
- **Data** selalu diambil ulang dari server setelah operasi tulis. Tidak ada
  duplikasi state di klien yang bisa basi.

### Komponen penting

**`Select.jsx` — combobox kustom.**
Native `<select>` tidak bisa digayakan dan panelnya dirender OS, sehingga menutupi
tabel di belakangnya. Dengan 100 buku, itu tidak terpakai. Komponen ini punya
pencarian di dalam daftar, navigasi keyboard, dan menampilkan stok tiap buku.

**`SearchCommand.jsx` — pencarian global.**
Menunggu 250 ms setelah ketukan terakhir (debounce) sebelum memanggil API, supaya
tidak mengirim satu request per huruf. Hasil dikelompokkan Buku/Anggota, bisa
dipilih dengan keyboard, dan mengarahkan ke halaman terkait dengan `?q=`.

**`sort.js` — `useSortable`.**
Pengurutan dilakukan **di sisi klien** karena seluruh data sudah ada di memori
halaman. Ini instan dan tidak membebani server. Kalau nanti ada paginasi, pengurutan
harus pindah ke server.

**`hooks.js` — `useCountUp`.**
Menganimasikan angka dasbor dengan `requestAnimationFrame` dan easing, dan langsung
menampilkan nilai akhir bila pengguna mengaktifkan `prefers-reduced-motion`.

### Kenapa ada proxy di `vite.config.js`?

```js
proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
```

Browser memandang semua request berasal dari origin yang sama (`localhost:5173`),
jadi **tidak ada masalah CORS**. Frontend memakai path relatif `/api`, sehingga
build yang sama bisa dipasang di belakang host apa pun tanpa diubah.

### Pintasan keyboard

`Ctrl+K` / `Cmd+K` memfokuskan kotak pencarian — pola yang sama dengan aplikasi
modern lain.

---

## 12. Bank Pertanyaan Dosen

### A. Soal OOP

**T: Tunjukkan encapsulation di kode kamu.**
> J: Di `Book.java`, semua field `private`. Stok hanya bisa diubah lewat
> `setStock()` yang menolak nilai negatif, dan lewat `decreaseStock()` /
> `increaseStock()` yang menjaga agar stok tidak di bawah nol.

**T: Apa bedanya abstract class dan interface? Kenapa kamu pakai keduanya?**
> J: Abstract class untuk hubungan *is-a* dan berbagi state — `Member` menyimpan
> `id`, `name`, dan sudah punya method konkret `calculateFine()`. Interface untuk
> kontrak kemampuan — `DataManager` tidak butuh state, hanya butuh janji bahwa
> kelas yang mengimplementasikannya bisa `saveData` dan `loadData`.

**T: Di mana polymorphism-nya? Kalau tidak ada, apa yang rusak?**
> J: Di empat method abstrak yang di-override `Student` dan `Lecturer`. Kalau tidak
> ada, `LibraryManager` harus menulis `if (member instanceof Student)` di setiap
> tempat yang butuh kuota, durasi, dan denda — dan setiap kategori baru berarti
> mengubah banyak file.

**T: Apa beda overriding dan overloading?**
> J: Overriding = kelas anak mendefinisikan ulang method induk dengan signature
> sama (`getLoanQuota()`). Overloading = nama sama, parameter berbeda, dalam satu
> kelas. Di proyek ini yang dipakai overriding; overloading hanya muncul di
> constructor `Loan` (dua versi, untuk transaksi baru dan untuk memuat dari file).

**T: Kenapa `Member` abstrak, bukan interface?**
> J: Karena `Member` punya state yang harus diwarisi (`id`, `name`,
> `identityNumber`, `activeLoanIds`) dan method konkret `calculateFine()`. Interface
> tidak bisa menyimpan field instance.

**T: Kenapa `MemberType` pakai enum?**
> J: Supaya kategori terbatas pada dua nilai yang sah dan tidak bisa salah ketik.
> Enum juga menjadi satu-satunya sumber kode yang dikenali saat membaca file.

### B. Soal Collection & Exception

**T: Kenapa `ArrayList`, bukan array biasa?**
> J: Ukuran data tidak diketahui di awal dan berubah terus. `ArrayList` menangani
> penambahan otomatis, punya method pencarian dan pengurutan, dan lebih aman
> daripada array yang harus dikelola indeksnya manual.

**T: Kenapa tidak pakai `HashMap`?**
> J: Untuk pencarian berdasarkan ID, `HashMap` memang O(1) dan lebih cepat. Tapi
> laporan mensyaratkan `ArrayList`, jumlah data masih kecil, dan `ArrayList`
> menjaga urutan. Kalau data membesar, saya akan menambah `Map` sebagai indeks
> di samping `ArrayList`.

**T: Checked atau unchecked exception? Kenapa?**
> J: Unchecked (`RuntimeException`). Penanganannya terpusat di
> `ApiExceptionHandler`, jadi memaksa setiap lapisan mendeklarasikan `throws` tidak
> menambah keamanan, hanya menambah kode.

**T: Kenapa tiga jenis exception, tidak satu saja?**
> J: Karena tiga kegagalan itu berbeda artinya dan berbeda penanganannya.
> Input salah (400) bisa diperbaiki pengguna. Data tidak ada (404) berarti salah
> alamat. Gagal simpan (500) adalah masalah sistem. Kalau digabung, frontend tidak
> bisa membedakan mana yang perlu ditampilkan sebagai peringatan dan mana yang bug.

**T: Di mana `try-catch` dipakai?**
> J: Di `FileDataManager` untuk semua operasi I/O dan parsing, dan di
> `LibraryManager.persistSafely()` serta `loadFromStorage()` untuk menangani
> kegagalan penyimpanan/pemuatan tanpa mematikan aplikasi.

### C. Soal aturan bisnis

**T: Bagaimana denda dihitung?**
> J: `Loan.processReturn()` menghitung selisih hari antara tanggal kembali dan
> jatuh tempo. Kalau positif, `member.calculateFine(hari)` mengalikan dengan tarif
> kategori anggota — Rp1.000 untuk Mahasiswa, Rp2.000 untuk Dosen. Kalau tidak
> terlambat, denda nol.

**T: Kenapa tanggal jatuh tempo tidak diinput pengguna?**
> J: Karena jatuh tempo adalah **akibat** dari kategori anggota, bukan keputusan
> petugas. Kalau diinput manual, bisa terjadi Mahasiswa diberi 14 hari. Dengan
> menghitungnya di constructor `Loan`, kesalahan itu mustahil terjadi.

**T: Bagaimana mencegah anggota meminjam buku yang sama dua kali?**
> J: `borrowBook()` memeriksa apakah ada transaksi aktif dengan anggota dan buku
> yang sama. Kalau ada, ditolak dengan pesan bahwa buku itu belum dikembalikan.

**T: Apa yang terjadi kalau buku dihapus saat masih dipinjam?**
> J: Ditolak. `deleteBook()` menghitung transaksi aktif yang merujuk buku itu; kalau
> lebih dari nol, muncul `ValidationException`. Aturan yang sama berlaku untuk
> `deleteMember()`.

**T: Bagaimana kuota dicek?**
> J: `member.getActiveLoanCount() >= member.getLoanQuota()`. `activeLoanCount`
> bertambah saat meminjam dan berkurang saat mengembalikan, jadi selalu
> mencerminkan keadaan sebenarnya.

**T: Kenapa validasi di server, bukan cukup di form?**
> J: Karena form bisa dilewati — orang bisa memanggil API langsung dengan curl.
> Validasi di server adalah satu-satunya yang mengikat. Validasi di frontend hanya
> untuk kenyamanan, bukan keamanan.

**T: Apa beda FR-05 dan FR-07?**
> J: FR-05 adalah penentuan **tanggal jatuh tempo** (7/14 hari) yang terjadi saat
> peminjaman. FR-07 adalah perhitungan **denda** yang terjadi saat pengembalian.
> Keduanya memakai data kategori yang sama tapi di momen berbeda.

### D. Soal penyimpanan

**T: Bagaimana data tetap ada setelah aplikasi ditutup?**
> J: Setiap operasi tulis memanggil `persistSafely()` yang menulis seluruh data ke
> `perpustakaan.csv`. Saat aplikasi start, `ApplicationReadyEvent` memanggil
> `loadFromStorage()` untuk memuatnya kembali.

**T: Apa yang terjadi kalau file rusak?**
> J: `loadData()` melempar `DataAccessException` dengan nomor baris yang bermasalah.
> `SIMPustakaApplication` menangkapnya, mencatat di log, dan aplikasi tetap
> berjalan dengan data kosong — tidak crash.

**T: Kenapa menulis ke file `.tmp` dulu?**
> J: Supaya penulisan bersifat atomik. Kalau proses mati di tengah penulisan, file
> asli masih utuh. Tanpa ini, file bisa setengah tertulis dan seluruh data hilang.

**T: Bagaimana kalau dua petugas menyimpan bersamaan?**
> J: Semua method `LibraryManager` dan `FileDataManager` memakai `synchronized`,
> jadi hanya satu thread yang boleh mengeksekusi satu waktu. Untuk skala satu
> perpustakaan ini memadai; untuk banyak server perlu database dengan transaksi.

**T: Kenapa file, bukan database?**
> J: Batasan masalah mengizinkan keduanya. File dipilih karena tanpa instalasi,
> mudah diperiksa, dan cukup untuk skalanya. Karena `DataManager` adalah interface,
> pindah ke database hanya perlu kelas baru — `LibraryManager` tidak berubah.

### E. Soal frontend & arsitektur

**T: Kenapa backend Java dan frontend React, padahal laporan menyebut Java Swing?**
> J: Instruksi pengerjaan meminta backend Java dan frontend React. Yang saya jaga
> adalah **logika OOP-nya tetap murni Java** di paket `domain/` — tanpa import
> Spring sama sekali. Jadi kalau dibutuhkan versi desktop Swing, kelas domain dan
> manager bisa dipakai ulang tanpa diubah.

**T: Kenapa ada DTO? Kenapa tidak kirim objek domain langsung?**
> J: Tiga alasan: mencegah kebocoran field internal, memisahkan bentuk API dari
> struktur kelas (ganti nama field tidak merusak API), dan menghindari JSON
> berulang akibat relasi dua arah `Loan` ↔ `Member`.

**T: Kenapa pengurutan di frontend, bukan backend?**
> J: Karena seluruh data halaman sudah dimuat di klien, pengurutan lokal instan dan
> tidak membebani server. Kalau nanti ditambah paginasi, pengurutan harus pindah ke
> server karena klien tidak lagi punya seluruh data.

**T: Kenapa pencarian di backend?**
> J: Karena pencarian harus mencakup seluruh koleksi, bukan hanya yang sudah dimuat
> di satu halaman. Selain itu aturan pencocokan (case-insensitive, multi-field)
> cukup ditulis sekali di server.

**T: Kenapa ada proxy di Vite?**
> J: Agar browser melihat semua request berasal dari origin yang sama, sehingga
> tidak ada preflight CORS. Frontend memakai path relatif `/api` yang juga bekerja
> saat di-deploy di belakang reverse proxy.

**T: Kenapa membuat combobox sendiri, tidak pakai `<select>`?**
> J: Native `<select>` dirender sistem operasi sehingga tidak bisa digayakan,
> panelnya menutupi tabel di belakang, dan tidak mendukung pencarian. Dengan 100
> buku itu tidak terpakai. Komponen kustom juga memberi navigasi keyboard dan
> menampilkan stok tiap buku.

**T: Apa itu React hooks yang kamu pakai?**
> J: `useState` untuk state, `useEffect` untuk efek samping (ambil data, event
> listener), `useMemo` untuk perhitungan yang di-cache, `useCallback` untuk
> mempertahankan identitas fungsi. Tidak ada Redux karena skalanya tidak perlu.

### F. Soal pengujian & kualitas

**T: Bagaimana kamu menguji sistem ini?**
> J: Ada 18 unit test di `LibraryManagerTest` yang dinamai menurut kode FR. Yang
> diuji bukan hanya jalur benar, tapi juga penolakan: stok habis, kuota terlampaui,
> ID duplikat, pengembalian ganda, tanggal kembali sebelum tanggal pinjam, dan
> file rusak. Selain itu saya menguji API dengan HTTP sungguhan dan menggerakkan
> antarmuka di browser untuk alur utama.

**T: Kalau data jadi 1 juta buku, apa yang rusak?**
> J: Tiga hal. Pertama, `ArrayList` untuk pencarian linear jadi lambat — perlu
> indeks `Map` atau query database. Kedua, seluruh data ditulis ulang ke file setiap
> ada perubahan — perlu penyimpanan inkremental atau database. Ketiga, frontend
> memuat semua baris sekaligus — perlu paginasi di server.

**T: Apa yang belum ada di sistem ini?**
> J: Lihat Bagian 13. Singkatnya: autentikasi petugas, paginasi, dan pencatatan
> denda yang sudah dibayar. Semuanya di luar batasan masalah, tapi saya tahu di
> mana harus menambahkannya.

---

## 13. Keterbatasan yang Diakui

Jujur menyebutkan batasan lebih baik daripada pura-pura sempurna. Kalau dosen
menemukan ini sendiri, kamu terlihat tidak memahami sistemnya.

| Keterbatasan | Sebab | Kalau harus diperbaiki |
|---|---|---|
| Tidak ada login/autentikasi | Batasan masalah hanya satu aktor (Petugas) | Tambah Spring Security + tabel pengguna |
| Tidak ada paginasi | Data uji masih wajar untuk satu tabel | Tambah parameter `page`/`size` di controller |
| Seluruh data ditulis ulang tiap perubahan | Sederhana dan aman untuk skala kecil | Ganti ke database atau tulis inkremental |
| Denda tidak mencatat status pembayaran | Tidak diminta; laporan hanya minta perhitungan | Tambah field `paidAt` di `Loan` |
| File rusak → data di memori dikosongkan | Aplikasi diutamakan tetap hidup | Tambah backup otomatis sebelum menimpa |
| Tidak ada riwayat perubahan data (audit) | Di luar lingkup | Tambah tabel log |
| Pencarian linear O(n) | `ArrayList` sesuai rancangan | Tambah indeks `Map` |

---

## 14. Glosarium

| Istilah | Arti singkat |
|---|---|
| **DTO** | *Data Transfer Object* — objek khusus untuk membawa data antar lapisan |
| **Entity/Domain object** | Objek yang merepresentasikan konsep bisnis (`Book`, `Member`) |
| **Encapsulation** | Menyembunyikan data di balik method |
| **Inheritance** | Pewarisan sifat dari kelas induk |
| **Polymorphism** | Satu perintah, perilaku berbeda per tipe objek |
| **Abstraction** | Menyembunyikan detail, menampilkan kontrak |
| **Overriding** | Menulis ulang method induk di kelas anak |
| **Overloading** | Nama method sama, parameter berbeda |
| **Immutable** | Objek yang tidak bisa diubah setelah dibuat |
| **Record** | Kelas ringkas Java untuk membawa data (getter/constructor otomatis) |
| **Atomic write** | Menulis ke file sementara lalu mengganti, agar tidak korup |
| **Debounce** | Menunda eksekusi sampai pengguna berhenti mengetik |
| **Proxy** | Perantara yang meneruskan request ke server lain |
| **`synchronized`** | Menjamin hanya satu thread mengeksekusi satu waktu |
| **Unchecked exception** | Exception yang tidak wajib ditangani di signature method |

---

## 15. Log Pembaruan

Dokumen ini diperbarui setiap ada perubahan pada sistem.

| Tanggal | Perubahan sistem | Bagian yang diperbarui |
|---|---|---|
| 2026-11-15 | Rilis awal: backend Java + frontend React, 11 FR terpenuhi | Seluruh dokumen |
| 2026-11-15 | Perombakan UI: sistem desain minimalis, motion, skeleton, aksesibilitas WCAG AA | §11 |
| 2026-11-15 | Data uji: 100 buku, 30 anggota (20 mahasiswa + 10 dosen), 32 transaksi | §4, §13 |
| 2026-11-15 | UI dinamis: combobox kustom, pencarian global di topbar, sortir tabel, galeri buku | §11, §12.E |

---

*Dokumen ini ditulis untuk dipahami, bukan dihafal. Kalau ada bagian yang belum
jelas, tanyakan — lebih baik bertanya sekarang daripada bingung saat ditanya dosen.*
