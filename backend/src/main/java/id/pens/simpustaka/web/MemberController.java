package id.pens.simpustaka.web;

import id.pens.simpustaka.domain.Lecturer;
import id.pens.simpustaka.domain.Member;
import id.pens.simpustaka.domain.MemberType;
import id.pens.simpustaka.domain.Student;
import id.pens.simpustaka.dto.DtoMapper;
import id.pens.simpustaka.dto.MemberRequest;
import id.pens.simpustaka.dto.MemberResponse;
import id.pens.simpustaka.dto.MemberRuleResponse;
import id.pens.simpustaka.manager.LibraryManager;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Endpoint pengelolaan data anggota dan pencarian anggota (FR-02, FR-03). */
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final LibraryManager libraryManager;

    public MemberController(LibraryManager libraryManager) {
        this.libraryManager = libraryManager;
    }

    @GetMapping
    public List<MemberResponse> list(@RequestParam(name = "q", required = false) String keyword) {
        return DtoMapper.toMembers(libraryManager.searchMembers(keyword));
    }

    @GetMapping("/{id}")
    public MemberResponse detail(@PathVariable String id) {
        return DtoMapper.toMember(libraryManager.findMember(id));
    }

    /** Aturan sirkulasi per kategori anggota, dipakai antarmuka untuk menampilkan ketentuan. */
    @GetMapping("/rules")
    public List<MemberRuleResponse> rules() {
        return List.of(
                DtoMapper.toRule(MemberType.STUDENT, Student.LOAN_QUOTA, Student.LOAN_PERIOD_DAYS,
                        Student.FINE_RATE_PER_DAY),
                DtoMapper.toRule(MemberType.LECTURER, Lecturer.LOAN_QUOTA, Lecturer.LOAN_PERIOD_DAYS,
                        Lecturer.FINE_RATE_PER_DAY));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse create(@Valid @RequestBody MemberRequest request) {
        Member member = libraryManager.addMember(request.type(), request.id(), request.name(),
                request.identityNumber());
        return DtoMapper.toMember(member);
    }

    @PutMapping("/{id}")
    public MemberResponse update(@PathVariable String id, @Valid @RequestBody MemberRequest request) {
        Member member = libraryManager.updateMember(id, request.type(), request.name(),
                request.identityNumber());
        return DtoMapper.toMember(member);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        libraryManager.deleteMember(id);
    }
}
