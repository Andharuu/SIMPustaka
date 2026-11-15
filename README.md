# SIMPustaka — Library Management System

Aplikasi pengelolaan perpustakaan (SIMPustaka) hasil rancang bangun berdasarkan
*Laporan Progress Final Projek PBO Kelompok 9*. Sistem mengelola **koleksi buku**,
**keanggotaan**, **pencarian data**, serta **sirkulasi peminjaman dan pengembalian**
beserta perhitungan denda otomatis.

- **Backend:** Java 21 + Spring Boot 3.5 (domain OOP murni)
- **Frontend:** React 19 + Vite 7
- **Penyimpanan:** File Handling (berkas teks UTF-8 lokal)

> 📘 **Untuk presentasi / tanya-jawab dosen**, baca **[BAHAN-BELAJAR.md](BAHAN-BELAJAR.md)** —
> berisi penjelasan "kenapa" di balik setiap keputusan teknis, 33 pertanyaan dosen
> beserta jawabannya, dan daftar keterbatasan sistem. Dokumen itu diperbarui setiap
> ada perubahan.
>
> 📊 **Status pengerjaan & kepatuhan terhadap instruksi** ada di
> **[PROGRESS-PLAN.md](PROGRESS-PLAN.md)** — matriks syarat vs implementasi,
> progres per tahapan 4 minggu, dan daftar pekerjaan yang belum selesai.

---

## 1. Aturan Sirkulasi

Batas masalah laporan menetapkan dua kategori anggota dengan ketentuan berbeda:

| Kategori | Kelas Domain | Kuota Pinjam | Durasi Pinjam | Denda Keterlambatan |
|---|---|---|---|---|
| Mahasiswa | `Student` | maks. **3** buku | **7** hari | **Rp1.000** / hari |
| Dosen | `Lecturer` | maks. **5** buku | **14** hari | **Rp2.000** / hari |

Aktor tunggal yang mengoperasikan sistem adalah **Petugas Perpustakaan (Admin/Operator)**.

---

## 2. Struktur Folder

```
SIMPustaka/
├── backend/                          # Java 21 + Spring Boot
│   ├── mvnw / mvnw.cmd               # Maven Wrapper (tanpa instalasi Maven)
│   ├── pom.xml
│   └── src/
│       ├── main/java/id/pens/simpustaka/
│       │   ├── SIMPustakaApplication.java   # bootstrap + muat data saat start
│       │   ├── domain/               # ── Lapisan OOP inti (sesuai Class Diagram)
│       │   │   ├── Book.java         #    koleksi buku (Encapsulation)
│       │   │   ├── Member.java       #    kelas abstrak anggota (Abstraction)
│       │   │   ├── Student.java      #    Mahasiswa  (Inheritance + Overriding)
│       │   │   ├── Lecturer.java     #    Dosen      (Inheritance + Overriding)
│       │   │   ├── MemberType.java   #    enum kategori anggota
│       │   │   └── Loan.java         #    transaksi + jatuh tempo + denda
│       │   ├── data/                 # ── Penyimpanan permanen
│       │   │   ├── DataManager.java  #    interface penyimpanan (Abstraction)
│       │   │   ├── FileDataManager.java  # implementasi File Handling
│       │   │   └── LibrarySnapshot.java  # hasil pembacaan data
│       │   ├── manager/
│       │   │   ├── LibraryManager.java   # operasional + validasi + ArrayList
│       │   │   └── LibraryStats.java     # ringkasan statistik
│       │   ├── dto/                  # kontrak JSON request/response
│       │   ├── exception/            # ValidationException, NotFoundException, ...
│       │   └── web/                  # REST controller + Exception Handler
│       ├── main/resources/application.yml
│       └── test/java/id/pens/simpustaka/LibraryManagerTest.java
│
├── frontend/                         # React 19 + Vite
│   ├── package.json / vite.config.js
│   └── src/
│       ├── main.jsx / App.jsx        # bootstrap + routing
│       ├── styles.css
│       ├── lib/
│       │   ├── api.js                # klien API backend
│       │   └── format.js             # format tanggal & Rupiah
│       ├── components/               # PageHeader, Alert, StatusBadge
│       └── pages/
│           ├── DashboardPage.jsx     # ringkasan
│           ├── BooksPage.jsx         # FR-01
│           ├── MembersPage.jsx       # FR-02
│           ├── SearchPage.jsx        # FR-03
│           ├── LoansPage.jsx         # FR-04, FR-05
│           ├── ReturnsPage.jsx       # FR-06, FR-07
│           └── HistoryPage.jsx       # FR-08
└── README.md
```

---

## 3. Menjalankan Aplikasi

Aplikasi terdiri dari dua proses yang **harus jalan bersamaan**: backend Java
(port 8080) dan frontend React (port 5173). Bila backend mati, frontend akan
menampilkan galat proxy `ECONNREFUSED` pada setiap permintaan `/api`.

### Prasyarat
- **JDK 21+** (diuji pada JDK 26) — cek dengan `java -version`
- **Node.js 18+** — cek dengan `node -v`

### Backend (port 8080)

**PowerShell** — perhatikan awalan `.\` (PowerShell tidak menjalankan program
dari folder aktif tanpa awalan tersebut):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Command Prompt (cmd)**:

```bat
cd backend
mvnw.cmd spring-boot:run
```

**Git Bash / Linux / macOS**:

```bash
cd backend
./mvnw spring-boot:run
```

Backend siap ketika log menampilkan `Started SIMPustakaApplication`.
Uji cepat di terminal lain: `curl http://localhost:8080/api/dashboard/stats`

Alternatif tanpa Maven Wrapper (memakai jar):

```bash
cd backend
java -jar target/simpustaka-1.0.0.jar
```

### Frontend (port 5173)

Buka **terminal kedua** (biarkan backend tetap berjalan):

```bash
cd frontend
npm install     # cukup sekali
npm run dev
```

Buka <http://localhost:5173>. Vite mem-proxy seluruh `/api` ke `http://localhost:8080`,
sehingga tidak diperlukan konfigurasi CORS tambahan.

### Menjalankan pengujian

```powershell
cd backend
.\mvnw.cmd test     # 18 pengujian aturan bisnis
```

### Jika muncul galat

| Gejala | Penyebab | Solusi |
|---|---|---|
| `ECONNREFUSED` / `http proxy error: /api/...` | Backend belum/tidak berjalan | Jalankan backend di terminal terpisah, tunggu sampai `Started SIMPustakaApplication` |
| `'mvnw.cmd' is not recognized` (PowerShell) | PowerShell tidak memuat program dari folder aktif | Pakai `.\mvnw.cmd`, bukan `mvnw.cmd` |
| `Port 8080 was already in use` | Instance backend lama masih hidup | `netstat -ano \| findstr :8080` lalu `taskkill /PID <pid> /F` |
| `Port 5173 is in use` | Proyek lain memakai port itu | `npm run dev -- --port 5174`, atau tutup proses lama |

---

## 4. Pemenuhan Kebutuhan Fungsional

| Kode | Kebutuhan | Implementasi |
|---|---|---|
| **FR-01** | Kelola data buku | `LibraryManager.addBook/updateBook/deleteBook`, `BookController`, `BooksPage` — menampilkan stok & ketersediaan |
| **FR-02** | Kelola data anggota | `addMember/updateMember/deleteMember`, `MemberController`, `MembersPage` — kategori Mahasiswa/Dosen |
| **FR-03** | Pencarian data | `searchBooks`, `searchMembers`, `SearchPage` — berdasarkan judul/ID/penulis dan identitas anggota |
| **FR-04** | Transaksi peminjaman | `borrowBook` memvalidasi identitas anggota, ketersediaan stok, dan batas kuota kategori |
| **FR-05** | Penentuan jatuh tempo | `Loan` menghitung `dueDate = loanDate + getLoanPeriodDays()` (7/14 hari) |
| **FR-06** | Transaksi pengembalian | `returnBook` mencatat tanggal kembali dan menambah stok buku |
| **FR-07** | Perhitungan denda | `Member.calculateFine()` → Rp1.000 (Mahasiswa) / Rp2.000 (Dosen) per hari terlambat |
| **FR-08** | Riwayat transaksi | `getLoanHistory()`, `HistoryPage` — transaksi tersimpan beserta status & denda |
| **FR-09** | Penyimpanan data | `FileDataManager.saveData()` menulis berkas atomik setiap perubahan |
| **FR-10** | Pembacaan data | `loadFromStorage()` dipanggil saat aplikasi start |
| **FR-11** | Validasi & penanganan kesalahan | Blok `try-catch` di `LibraryManager`/`FileDataManager`, exception khusus, `ApiExceptionHandler` |

---

## 5. Penerapan Prinsip OOP

| Prinsip | Wujud dalam Kode |
|---|---|
| **Class & Object** | `Book`, `Member`, `Student`, `Lecturer`, `Loan`, `LibraryManager`, `DataManager` |
| **Constructor** | Setiap kelas domain memiliki konstruktor bervalidasi (mis. `Loan(member, book, loanDate)` menghitung jatuh tempo) |
| **Encapsulation** | Atribut `private`/`protected` diakses via getter/setter tervalidasi; `setStock` menolak nilai negatif |
| **Inheritance** | `Student extends Member`, `Lecturer extends Member` |
| **Polymorphism** | Method Overriding `getLoanQuota()`, `getLoanPeriodDays()`, `getFineRatePerDay()` — perilaku berbeda per kategori tanpa percabangan `if` di pemanggil |
| **Abstraction** | `Member` sebagai kelas abstrak; `DataManager` sebagai interface penyimpanan |

### Collection Framework & Exception Handling

- `LibraryManager` menyimpan data pada `ArrayList<Book>`, `ArrayList<Member>`, dan
  `ArrayList<Loan>` sesuai rancangan laporan.
- Exception khusus: `ValidationException` (input tidak valid), `NotFoundException`
  (data tidak ada), `DataAccessException` (kegagalan I/O atau berkas rusak).
- Seluruh operasi I/O dan parsing berkas dibungkus `try-catch`; kegagalan
  penyimpanan tidak membuat aplikasi berhenti mendadak.

---

## 6. Format Berkas Data

Berkas `backend/data/perpustakaan.csv` (dibuat otomatis) memakai pemisah `;`:

```
# SIMPustaka data file
[BOOK]
B-001;Struktur Data;Rosa A. S.;Informatika;2

[MEMBER]
STUDENT;A-001;Putri Norma Yunita;3125521010
LECTURER;A-002;Andharu Raffi;198701012020121001

[LOAN]
TRX-20261101-0001;A-001;B-001;2026-11-01;2026-11-08;2026-11-15;7000;7;RETURNED
```

Kolom blok `[LOAN]`: ID transaksi, ID anggota, ID buku, tanggal pinjam, jatuh tempo,
tanggal kembali, denda, hari terlambat, status.

Lokasi berkas dapat diubah melalui environment variable
`SIMPUSTAKA_DATA_DIRECTORY` dan `SIMPUSTAKA_DATA_FILE`.

---

## 7. Sistem Desain Antarmuka

Antarmuka memakai bahasa visual minimalis presisi dengan satu aksen kromatik,
mengikuti prinsip desain produk modern (Linear/Vercel): konten terang untuk
permukaan kerja data, sidebar gelap sebagai jangkar visual.

**Token utama** (`frontend/src/styles.css`):

| Aspek | Nilai |
|---|---|
| Tipografi | Inter variable, bobot 400 / 510 / 590, letter-spacing negatif pada judul |
| Aksen tunggal | Indigo `#5e6ad2`, teks pil `#4f5ac0` |
| Permukaan | `#fbfbfc` (halaman), `#ffffff` (kartu), `#0f1011` (sidebar) |
| Garis | `rgba(8,9,10,0.085)` — whisper-thin, bukan border tebal |
| Radius | 6px kontrol, 8px kartu kecil, 12px panel, pill penuh untuk badge |

**Motion** (menjelaskan perubahan state, bukan teater):

- Halaman masuk berurutan (`pageIn` + `sectionIn` bertahap 40ms per blok).
- Baris tabel muncul bertingkat (`rowIn`, delay 25ms per baris).
- Tombol memberi umpan balik tekan (`scale 0.97`), kartu statistik terangkat saat hover.
- Angka dasbor dianimasikan dengan `useCountUp` (easeOutQuint).
- Skeleton shimmer saat data dimuat.
- Seluruh animasi dimatikan otomatis bila pengguna mengaktifkan `prefers-reduced-motion`.

### Komponen antarmuka utama

| Komponen | Berkas | Fungsi |
|---|---|---|
| **Combobox kustom** | `components/Select.jsx` | Pengganti `<select>` bawaan: dapat dicari, navigasi keyboard (↑↓/Enter/Esc), menampilkan label + keterangan + meta (mis. stok). Wajib untuk daftar panjang seperti 100 buku. |
| **Pencarian global** | `components/SearchCommand.jsx` | Kotak pencarian di topbar; mencari buku dan anggota sekaligus (FR-03), hasil dikelompokkan, pintasan `Ctrl+K`, klik hasil membuka halaman terkait dengan filter `?q=`. |
| **Tabel terurut** | `components/SortHeader.jsx` + `lib/sort.js` | Setiap kolom dapat diurutkan naik/turun; mendukung tipe teks, angka, dan tanggal; status diumumkan lewat `aria-sort`. |
| **Tampilan galeri** | `components/BookCard.jsx` + `components/ViewToggle.jsx` | Data buku dapat dilihat sebagai tabel atau kartu per buku; pilihan tampilan disimpan di `localStorage`. |

**Aksesibilitas:** seluruh pasangan warna teks/latar diuji terhadap WCAG AA
(rasio ≥ 4.5:1), termasuk teks pil status di atas latar bertint dan teks putih
pada tombol aksen beserta keadaan hover-nya.

---

## 8. Daftar Endpoint API

| Metode | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/books?q=` | Daftar / pencarian buku |
| POST | `/api/books` | Tambah buku |
| PUT | `/api/books/{id}` | Ubah buku |
| DELETE | `/api/books/{id}` | Hapus buku |
| GET | `/api/members?q=` | Daftar / pencarian anggota |
| GET | `/api/members/rules` | Aturan sirkulasi per kategori |
| POST | `/api/members` | Tambah anggota |
| PUT | `/api/members/{id}` | Ubah anggota |
| DELETE | `/api/members/{id}` | Hapus anggota |
| GET | `/api/loans?active=true` | Riwayat / peminjaman aktif |
| POST | `/api/loans` | Catat peminjaman |
| POST | `/api/loans/{id}/return` | Catat pengembalian + denda |
| GET | `/api/dashboard/stats` | Statistik dasbor |

Kesalahan dikembalikan sebagai JSON konsisten:
`{ "timestamp", "status", "error", "message" }`.
