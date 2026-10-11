package com.studypilot.service;

import com.studypilot.model.Session;
import com.studypilot.model.Subject;
import com.studypilot.model.Topic;
import com.studypilot.model.Unit;
import com.studypilot.repository.SessionRepository;
import com.studypilot.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class PlanService {

    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public PlanService(SubjectRepository subjectRepository, SessionRepository sessionRepository) {
        this.subjectRepository = subjectRepository;
        this.sessionRepository = sessionRepository;
    }

    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    @Transactional
    public List<Session> completeSession(String id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));
        session.setStatus("COMPLETED");
        session.setCompletedOn(LocalDate.now().format(DATE_FORMAT));
        sessionRepository.save(session);
        return sessionRepository.findAll();
    }

    // Generates daily study schedule
    @Transactional
    public List<Session> generatePlan(int dailyMinutes) {
        List<Subject> subjects = subjectRepository.findAll();
        if (subjects.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one subject first.");
        }

        LocalDate today = LocalDate.now();
        // Keep 85% for study, 15% as buffer
        int dailyCap = (int) Math.floor(dailyMinutes * 0.85);

        List<SubjectTracker> trackers = new ArrayList<>();
        long maxDays = 0;

        for (Subject s : subjects) {
            List<Topic> topics = new ArrayList<>();
            for (Unit u : s.getUnits()) {
                topics.addAll(u.getTopics());
            }

            LocalDate examDate = LocalDate.parse(s.getExamDate(), DATE_FORMAT);
            long daysLeft = ChronoUnit.DAYS.between(today, examDate);
            if (daysLeft < 1) {
                throw new IllegalArgumentException("Exam date for " + s.getName() + " must be after today.");
            }

            int totalMins = 0;
            for (Topic t : topics) {
                totalMins += t.getEstimatedMinutes();
            }

            trackers.add(new SubjectTracker(s, topics, daysLeft, totalMins));
            if (daysLeft > maxDays) {
                maxDays = daysLeft;
            }
        }

        List<Session> sessions = new ArrayList<>();

        for (int day = 0; day < maxDays; day++) {
            String dateStr = today.plusDays(day).format(DATE_FORMAT);

            List<SubjectTracker> active = new ArrayList<>();
            double totalPace = 0;

            for (SubjectTracker st : trackers) {
                if (st.remainingMinutes > 0 && day < st.daysLeft) {
                    active.add(st);
                    double pace = (double) st.remainingMinutes / (st.daysLeft - day);
                    totalPace += pace;
                }
            }

            if (active.isEmpty()) continue;

            int usedMinutesToday = 0;
            for (SubjectTracker st : active) {
                double pace = (double) st.remainingMinutes / (st.daysLeft - day);
                int allocated = (int) Math.min(Math.floor((dailyCap * pace) / totalPace), st.remainingMinutes);
                usedMinutesToday += scheduleMinutes(st, allocated, dateStr, sessions);
            }

            // Distribute leftover daily minutes to the subject with most remaining work
            int spare = dailyCap - usedMinutesToday;
            while (spare > 0) {
                SubjectTracker mostWork = null;
                for (SubjectTracker st : active) {
                    if (st.remainingMinutes > 0) {
                        if (mostWork == null || st.remainingMinutes > mostWork.remainingMinutes) {
                            mostWork = st;
                        }
                    }
                }
                if (mostWork == null) break;
                int used = scheduleMinutes(mostWork, spare, dateStr, sessions);
                if (used == 0) break;
                spare -= used;
            }
        }

        sessionRepository.deleteAll();
        sessionRepository.saveAll(sessions);
        return sessions;
    }

    private int scheduleMinutes(SubjectTracker st, int minutesToGive, String dateStr, List<Session> sessions) {
        int used = 0;
        while (minutesToGive > 0 && st.currentTopicIndex < st.topics.size()) {
            int chunk = Math.min(minutesToGive, st.minutesLeftInCurrentTopic);
            Topic topic = st.topics.get(st.currentTopicIndex);

            String sessionId = "ss" + (sessions.size() + 1);
            Session session = new Session(
                    sessionId,
                    dateStr,
                    st.subject.getId(),
                    st.subject.getName(),
                    topic.getId(),
                    topic.getTitle(),
                    chunk,
                    "PLANNED"
            );
            sessions.add(session);

            st.minutesLeftInCurrentTopic -= chunk;
            st.remainingMinutes -= chunk;
            minutesToGive -= chunk;
            used += chunk;

            if (st.minutesLeftInCurrentTopic == 0) {
                st.currentTopicIndex++;
                if (st.currentTopicIndex < st.topics.size()) {
                    st.minutesLeftInCurrentTopic = st.topics.get(st.currentTopicIndex).getEstimatedMinutes();
                }
            }
        }
        return used;
    }

    private static class SubjectTracker {
        Subject subject;
        List<Topic> topics;
        int currentTopicIndex = 0;
        int minutesLeftInCurrentTopic = 0;
        long daysLeft;
        int remainingMinutes;

        SubjectTracker(Subject subject, List<Topic> topics, long daysLeft, int remainingMinutes) {
            this.subject = subject;
            this.topics = topics;
            this.daysLeft = daysLeft;
            this.remainingMinutes = remainingMinutes;
            if (!topics.isEmpty()) {
                this.minutesLeftInCurrentTopic = topics.get(0).getEstimatedMinutes();
            }
        }
    }
}
