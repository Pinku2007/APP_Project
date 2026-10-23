package com.studypilot.service;

import com.studypilot.model.Subject;
import com.studypilot.model.Topic;
import com.studypilot.model.Unit;
import com.studypilot.repository.SessionRepository;
import com.studypilot.repository.SubjectRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;

    public SubjectService(SubjectRepository subjectRepository, SessionRepository sessionRepository) {
        this.subjectRepository = subjectRepository;
        this.sessionRepository = sessionRepository;
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // Read PDF file using PDFBox and extract text
    public Subject addSubjectFromPdf(String name, String examDate, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded PDF file is empty.");
        }
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String extractedText = stripper.getText(document);
            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new IllegalArgumentException("Could not extract any readable text from this PDF.");
            }
            return addSubjectFromText(name, examDate, extractedText);
        } catch (IllegalArgumentException iae) {
            throw iae;
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not read PDF file: " + e.getMessage());
        }
    }

    // Add subject from text input
    public Subject addSubjectFromText(String name, String examDate, String rawText) {
        String cleanName = name != null ? name.trim() : "";
        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Please enter a subject name.");
        }
        if (examDate == null || examDate.trim().isEmpty()) {
            throw new IllegalArgumentException("Please select an exam date.");
        }

        String subjectId = "s" + System.currentTimeMillis();
        List<Unit> units = parseUnits(rawText, subjectId);

        if (units.isEmpty()) {
            throw new IllegalArgumentException("No topics found. Please enter syllabus text or upload a PDF.");
        }

        Subject subject = new Subject(subjectId, cleanName, examDate.trim(), units);
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(String id) {
        subjectRepository.deleteById(id);
        sessionRepository.deleteBySubjectId(id);
    }

    // Split text into units and topics
    private List<Unit> parseUnits(String rawText, String subjectId) {
        List<Unit> units = new ArrayList<>();
        if (rawText == null || rawText.trim().isEmpty()) {
            return units;
        }

        // Put newline before Unit or Module headings
        String text = rawText.replace("\r", "\n");
        text = text.replaceAll("(?i)(?<!^)\\b(unit|module|chapter)\\s*([-:]?\\s*[0-9IVX]+)", "\n$1 $2");

        String[] lines = text.split("\n");
        int unitCount = 0;
        int topicCount = 0;

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            String lower = line.toLowerCase();
            if (lower.startsWith("unit") || lower.startsWith("module") || lower.startsWith("chapter")) {
                unitCount++;
                String unitTitle = line;
                String inlineTopics = "";

                int dashIndex = line.indexOf(" - ");
                if (dashIndex != -1) {
                    unitTitle = line.substring(0, dashIndex).trim();
                    inlineTopics = line.substring(dashIndex + 3).trim();
                }

                Unit unit = new Unit(subjectId + "-u" + unitCount, unitTitle, new ArrayList<>());
                units.add(unit);

                if (!inlineTopics.isEmpty()) {
                    topicCount = addTopicsFromText(inlineTopics, unit, subjectId, topicCount);
                }
            } else {
                if (units.isEmpty()) {
                    unitCount++;
                    units.add(new Unit(subjectId + "-u1", "Unit 1", new ArrayList<>()));
                }
                Unit currentUnit = units.get(units.size() - 1);
                topicCount = addTopicsFromText(line, currentUnit, subjectId, topicCount);
            }
        }

        List<Unit> nonEmpty = new ArrayList<>();
        for (Unit u : units) {
            if (!u.getTopics().isEmpty()) {
                nonEmpty.add(u);
            }
        }
        return nonEmpty;
    }

    // Split line by commas or semicolons into topics
    private int addTopicsFromText(String text, Unit unit, String subjectId, int topicCount) {
        String[] parts = text.split("[,;•]|\\.\\s+");
        for (String part : parts) {
            String title = part.trim();
            // Remove common bullet prefixes like "- ", "* ", "1. ", "1) "
            title = title.replaceAll("^[\\-\\*\u2022\\d+\\.\\)]+\\s*", "").trim();
            if (title.length() < 3) continue;

            String difficulty = "MEDIUM";
            int minutes = 45;

            String lower = title.toLowerCase();
            if (lower.contains("intro") || lower.contains("basic") || lower.contains("types") || lower.contains("overview")) {
                difficulty = "EASY";
                minutes = 30;
            } else if (lower.contains("advanced") || lower.contains("overriding") || lower.contains("polymorphism")
                    || lower.contains("multithreading") || lower.contains("exception") || title.length() > 30) {
                difficulty = "HARD";
                minutes = 60;
            }

            topicCount++;
            Topic topic = new Topic(subjectId + "-t" + topicCount, title, difficulty, minutes);
            unit.getTopics().add(topic);
        }
        return topicCount;
    }

    // Generates a sample PDF for quick testing
    public byte[] generateSamplePdf() {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.setLeading(18f);
                cs.newLineAtOffset(50, 720);
                String[] lines = {
                    "Unit 1: Object Oriented Programming Basics",
                    "Introduction to OOP, Classes and Objects, Constructors",
                    "Unit 2: Inheritance and Polymorphism",
                    "Types of Inheritance, Method Overloading, Method Overriding",
                    "Unit 3: Exception Handling and Multithreading",
                    "Try Catch Blocks, Custom Exceptions, Multithreading"
                };
                for (String line : lines) {
                    cs.showText(line);
                    cs.newLine();
                }
                cs.endText();
            }
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Could not create sample PDF", e);
        }
    }
}
