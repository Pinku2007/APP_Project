package com.studypilot.config;

import com.studypilot.model.Subject;
import com.studypilot.model.Topic;
import com.studypilot.model.Unit;
import com.studypilot.model.User;
import com.studypilot.repository.SubjectRepository;
import com.studypilot.repository.UserRepository;
import com.studypilot.service.PlanService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * DataInitializer
 * Runs on Spring Boot startup:
 * 1. Ensures the H2 data directory exists.
 * 2. Seeds default demo student accounts so the app is always ready for presentations.
 * 3. Seeds sample subject data if the database is brand new.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final PlanService planService;

    public DataInitializer(UserRepository userRepository,
                           SubjectRepository subjectRepository,
                           PlanService planService) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.planService = planService;
    }

    @Override
    public void run(String... args) {
        // 1. Ensure the H2 file database directory exists
        try {
            File dataDir = new File("./data");
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
        } catch (Exception ignored) {
        }

        // 2. Ensure default presentation / demo users exist
        seedUsers();

        // 3. Ensure sample subject and plan exist if database is completely new
        seedSampleDataIfEmpty();
    }

    private void seedUsers() {
        // Demo account: demo@studypilot.com / password123
        if (!userRepository.existsByEmailIgnoreCase("demo@studypilot.com")) {
            userRepository.save(new User("Demo Student", "demo@studypilot.com", "password123"));
        }

        // Student account: student@studypilot.com / password123
        if (!userRepository.existsByEmailIgnoreCase("student@studypilot.com")) {
            userRepository.save(new User("Harpreet Singh", "student@studypilot.com", "password123"));
        }
    }

    private void seedSampleDataIfEmpty() {
        if (subjectRepository.count() == 0) {
            String subjectId = "s_demo_oop";
            String examDate = LocalDate.now().plusDays(14).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            List<Unit> units = new ArrayList<>();

            // Unit 1
            List<Topic> u1Topics = new ArrayList<>();
            u1Topics.add(new Topic(subjectId + "-t1", "Introduction to OOP", "EASY", 30));
            u1Topics.add(new Topic(subjectId + "-t2", "Classes and Objects", "MEDIUM", 45));
            u1Topics.add(new Topic(subjectId + "-t3", "Constructors & Destructors", "MEDIUM", 45));
            units.add(new Unit(subjectId + "-u1", "Unit 1: OOP Basics", u1Topics));

            // Unit 2
            List<Topic> u2Topics = new ArrayList<>();
            u2Topics.add(new Topic(subjectId + "-t4", "Types of Inheritance", "MEDIUM", 45));
            u2Topics.add(new Topic(subjectId + "-t5", "Method Overriding & Polymorphism", "HARD", 60));
            u2Topics.add(new Topic(subjectId + "-t6", "Interfaces and Abstract Classes", "HARD", 60));
            units.add(new Unit(subjectId + "-u2", "Unit 2: Inheritance & Polymorphism", u2Topics));

            // Unit 3
            List<Topic> u3Topics = new ArrayList<>();
            u3Topics.add(new Topic(subjectId + "-t7", "Try-Catch Exception Handling", "MEDIUM", 45));
            u3Topics.add(new Topic(subjectId + "-t8", "Multithreading Basics", "HARD", 60));
            units.add(new Unit(subjectId + "-u3", "Unit 3: Exceptions & Concurrency", u3Topics));

            Subject sampleSubject = new Subject(subjectId, "Object Oriented Programming", examDate, units);
            subjectRepository.save(sampleSubject);

            // Generate initial study plan (3 hours / 180 mins daily)
            try {
                planService.generatePlan(180);
            } catch (Exception ignored) {
            }
        }
    }
}
