package com.studypilot.model;

import jakarta.persistence.*;

/**
 * Session Entity
 * Represents an individual scheduled study session for a topic on a specific date.
 */
@Entity
@Table(name = "study_sessions")
public class Session {

    @Id
    private String id;

    @Column(nullable = false)
    private String date; // Format: YYYY-MM-DD

    @Column(nullable = false)
    private String subjectId;

    @Column(nullable = false)
    private String subjectName;

    @Column(nullable = false)
    private String topicId;

    @Column(nullable = false)
    private String topicTitle;

    @Column(nullable = false)
    private int minutes;

    @Column(nullable = false)
    private String status; // "PLANNED", "COMPLETED", "SKIPPED"

    private Integer actualMinutes;

    private Integer confidence; // 1 to 5

    private String completedOn; // Format: YYYY-MM-DD

    public Session() {
    }

    public Session(String id, String date, String subjectId, String subjectName,
                   String topicId, String topicTitle, int minutes, String status) {
        this.id = id;
        this.date = date;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.topicId = topicId;
        this.topicTitle = topicTitle;
        this.minutes = minutes;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getTopicId() {
        return topicId;
    }

    public void setTopicId(String topicId) {
        this.topicId = topicId;
    }

    public String getTopicTitle() {
        return topicTitle;
    }

    public void setTopicTitle(String topicTitle) {
        this.topicTitle = topicTitle;
    }

    public int getMinutes() {
        return minutes;
    }

    public void setMinutes(int minutes) {
        this.minutes = minutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getActualMinutes() {
        return actualMinutes;
    }

    public void setActualMinutes(Integer actualMinutes) {
        this.actualMinutes = actualMinutes;
    }

    public Integer getConfidence() {
        return confidence;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence;
    }

    public String getCompletedOn() {
        return completedOn;
    }

    public void setCompletedOn(String completedOn) {
        this.completedOn = completedOn;
    }
}
