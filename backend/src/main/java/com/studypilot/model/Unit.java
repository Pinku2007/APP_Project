package com.studypilot.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Unit Entity
 * Represents a syllabus unit containing a list of topics.
 */
@Entity
@Table(name = "units")
public class Unit {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "unit_id")
    private List<Topic> topics = new ArrayList<>();

    public Unit() {
    }

    public Unit(String id, String title, List<Topic> topics) {
        this.id = id;
        this.title = title;
        this.topics = topics != null ? topics : new ArrayList<>();
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

    public List<Topic> getTopics() {
        return topics;
    }

    public void setTopics(List<Topic> topics) {
        this.topics = topics;
    }
}
