package com.studypilot.model;

import jakarta.persistence.*;

/**
 * Topic Entity
 * Represents an individual study topic inside a unit.
 */
@Entity
@Table(name = "topics")
public class Topic {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String difficulty; // "EASY", "MEDIUM", "HARD"

    @Column(nullable = false)
    private int estimatedMinutes;

    public Topic() {
    }

    public Topic(String id, String title, String difficulty, int estimatedMinutes) {
        this.id = id;
        this.title = title;
        this.difficulty = difficulty;
        this.estimatedMinutes = estimatedMinutes;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(int estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }
}
