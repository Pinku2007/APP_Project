package com.studypilot.controller;

import com.studypilot.model.Subject;
import com.studypilot.service.SubjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * SubjectController
 * Endpoints for adding subjects (via Text or PDF), listing subjects, and deleting subjects.
 */
@RestController
@RequestMapping("/api/syllabi")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<Subject> getSubjects() {
        return subjectService.getAllSubjects();
    }

    @PostMapping("/text")
    public Subject addSubjectFromText(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String examDate = body.get("examDate");
        String text = body.get("text");
        return subjectService.addSubjectFromText(name, examDate, text);
    }

    @PostMapping("/pdf")
    public Subject addSubjectFromPdf(
            @RequestParam("name") String name,
            @RequestParam("examDate") String examDate,
            @RequestParam("file") MultipartFile file) {
        return subjectService.addSubjectFromPdf(name, examDate, file);
    }

    @GetMapping("/sample-pdf")
    public ResponseEntity<byte[]> downloadSamplePdf() {
        byte[] pdfBytes = subjectService.generateSamplePdf();
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=sample-syllabus.pdf")
                .body(pdfBytes);
    }

    @DeleteMapping("/{id}")
    public void deleteSubject(@PathVariable String id) {
        subjectService.deleteSubject(id);
    }
}
