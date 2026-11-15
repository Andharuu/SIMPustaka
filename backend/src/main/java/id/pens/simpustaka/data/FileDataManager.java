package id.pens.simpustaka.data;

import id.pens.simpustaka.domain.Book;
import id.pens.simpustaka.domain.Lecturer;
import id.pens.simpustaka.domain.Loan;
import id.pens.simpustaka.domain.Member;
import id.pens.simpustaka.domain.MemberType;
import id.pens.simpustaka.domain.Student;
import id.pens.simpustaka.exception.DataAccessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementasi {@link DataManager} menggunakan File Handling (FR-09, FR-10, FR-11).
 *
 * <p>Format berkas: teks UTF-8 dengan satu record per baris dan pemisah titik-koma
 * {@code ;}, dibagi menjadi tiga blok {@code [BOOK]}, {@code [MEMBER]}, dan {@code [LOAN]}.
 * Penulisan dilakukan secara atomik (berkas sementara lalu diganti) agar data lama
 * tidak rusak bila proses penyimpanan gagal di tengah jalan.</p>
 *
 * <p>Seluruh operasi I/O dan parsing dibungkus blok try-catch sebagai penerapan
 * Exception Handling.</p>
 */
@Component
public class FileDataManager implements DataManager {

    private static final String SEP = ";";
    private static final String HEADER_BOOK = "[BOOK]";
    private static final String HEADER_MEMBER = "[MEMBER]";
    private static final String HEADER_LOAN = "[LOAN]";

    private final Path dataDirectory;
    private final String fileName;

    public FileDataManager(
            @Value("${simpustaka.data.directory:./data}") String dataDirectory,
            @Value("${simpustaka.data.file:perpustakaan.csv}") String fileName) {
        this.dataDirectory = Path.of(dataDirectory);
        this.fileName = fileName;
    }

    public Path getDataFile() {
        return dataDirectory.resolve(fileName);
    }

    @Override
    public synchronized void saveData(List<Book> books, List<Member> members, List<Loan> loans) {
        StringBuilder out = new StringBuilder();
        out.append("# SIMPustaka data file - format: record per baris, pemisah ';'\n");

        out.append(HEADER_BOOK).append('\n');
        for (Book book : books) {
            out.append(String.join(SEP,
                    escape(book.getId()),
                    escape(book.getTitle()),
                    escape(book.getAuthor()),
                    escape(book.getCategory()),
                    String.valueOf(book.getStock()))).append('\n');
        }

        out.append(HEADER_MEMBER).append('\n');
        for (Member member : members) {
            out.append(String.join(SEP,
                    member.getType().name(),
                    escape(member.getId()),
                    escape(member.getName()),
                    escape(member.getIdentityNumber()))).append('\n');
        }

        out.append(HEADER_LOAN).append('\n');
        for (Loan loan : loans) {
            out.append(String.join(SEP,
                    escape(loan.getId()),
                    escape(loan.getMember().getId()),
                    escape(loan.getBook().getId()),
                    loan.getLoanDate().toString(),
                    loan.getDueDate().toString(),
                    loan.getReturnDate() == null ? "" : loan.getReturnDate().toString(),
                    String.valueOf(loan.getFine()),
                    String.valueOf(loan.getLateDays()),
                    loan.getStatus())).append('\n');
        }

        Path target = getDataFile();
        Path temp = target.resolveSibling(fileName + ".tmp");
        try {
            Files.createDirectories(dataDirectory);
            Files.writeString(temp, out.toString(), StandardCharsets.UTF_8);
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new DataAccessException("Gagal menyimpan data ke " + target.toAbsolutePath(), e);
        } catch (UncheckedIOException e) {
            throw new DataAccessException("Gagal menyimpan data ke " + target.toAbsolutePath(), e.getCause());
        }
    }

    @Override
    public synchronized LibrarySnapshot loadData() {
        Path target = getDataFile();
        if (!Files.exists(target)) {
            return LibrarySnapshot.empty();
        }

        List<String> lines;
        try {
            lines = Files.readAllLines(target, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new DataAccessException("Gagal membaca berkas data " + target.toAbsolutePath(), e);
        }

        List<Book> books = new ArrayList<>();
        Map<String, Member> membersById = new LinkedHashMap<>();
        List<String[]> loanRows = new ArrayList<>();

        String section = "";
        int lineNumber = 0;
        try {
            for (String rawLine : lines) {
                lineNumber++;
                String line = rawLine;
                if (line == null || line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                if (HEADER_BOOK.equals(line.trim())) {
                    section = HEADER_BOOK;
                    continue;
                }
                if (HEADER_MEMBER.equals(line.trim())) {
                    section = HEADER_MEMBER;
                    continue;
                }
                if (HEADER_LOAN.equals(line.trim())) {
                    section = HEADER_LOAN;
                    continue;
                }
                String[] parts = line.split(SEP, -1);
                switch (section) {
                    case HEADER_BOOK -> {
                        requireFieldCount(parts, 5, "buku", lineNumber);
                        books.add(new Book(unescape(parts[0]), unescape(parts[1]), unescape(parts[2]),
                                unescape(parts[3]), Integer.parseInt(parts[4].trim())));
                    }
                    case HEADER_MEMBER -> {
                        requireFieldCount(parts, 4, "anggota", lineNumber);
                        Member member = createMember(MemberType.fromCode(parts[0]), unescape(parts[1]),
                                unescape(parts[2]), unescape(parts[3]));
                        membersById.put(member.getId(), member);
                    }
                    case HEADER_LOAN -> {
                        requireFieldCount(parts, 9, "transaksi", lineNumber);
                        loanRows.add(parts);
                    }
                    default -> throw new DataAccessException(
                            "Berkas data tidak valid pada baris " + lineNumber + ": blok tidak dikenal");
                }
            }
        } catch (DateTimeParseException | NumberFormatException e) {
            throw new DataAccessException("Berkas data tidak valid pada baris " + lineNumber
                    + ": format angka/tanggal salah (" + e.getMessage() + ")", e);
        }

        Map<String, Book> booksById = new LinkedHashMap<>();
        for (Book book : books) {
            booksById.put(book.getId(), book);
        }

        List<Loan> loans = new ArrayList<>();
        for (String[] parts : loanRows) {
            String loanId = unescape(parts[0]);
            Member member = membersById.get(unescape(parts[1]));
            Book book = booksById.get(unescape(parts[2]));
            if (member == null || book == null) {
                throw new DataAccessException(
                        "Berkas data tidak konsisten: transaksi " + loanId + " merujuk anggota/buku yang tidak ada");
            }
            LocalDate loanDate = LocalDate.parse(parts[3].trim());
            LocalDate dueDate = LocalDate.parse(parts[4].trim());
            LocalDate returnDate = parts[5].isBlank() ? null : LocalDate.parse(parts[5].trim());
            long fine = Long.parseLong(parts[6].trim());
            int lateDays = Integer.parseInt(parts[7].trim());
            String status = parts[8].trim();

            Loan loan = new Loan(loanId, member, book, loanDate, returnDate, fine, lateDays, status);
            if (!dueDate.equals(loan.getDueDate())) {
                throw new DataAccessException("Berkas data tidak konsisten: jatuh tempo transaksi "
                        + loanId + " (" + dueDate + ") berbeda dengan perhitungan kategori anggota ("
                        + loan.getDueDate() + ")");
            }
            loans.add(loan);
            if (!loan.isReturned()) {
                member.addActiveLoan(loan.getId());
            }
        }

        return new LibrarySnapshot(books, new ArrayList<>(membersById.values()), loans);
    }

    private static void requireFieldCount(String[] parts, int expected, String entity, int lineNumber) {
        if (parts.length != expected) {
            throw new DataAccessException("Berkas data tidak valid pada baris " + lineNumber
                    + ": jumlah kolom data " + entity + " harus " + expected + ", ditemukan " + parts.length);
        }
    }

    private static Member createMember(MemberType type, String id, String name, String identityNumber) {
        return switch (type) {
            case STUDENT -> new Student(id, name, identityNumber);
            case LECTURER -> new Lecturer(id, name, identityNumber);
        };
    }

    /** Membuat pemisah ';' pada isi teks aman disimpan. */
    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace(SEP, "\\;").replace("\n", " ").replace("\r", " ");
    }

    private static String unescape(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length());
        boolean escaped = false;
        for (char c : value.toCharArray()) {
            if (escaped) {
                sb.append(c);
                escaped = false;
            } else if (c == '\\') {
                escaped = true;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
