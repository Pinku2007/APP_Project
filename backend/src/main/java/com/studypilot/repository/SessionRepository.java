package com.studypilot.repository;

import com.studypilot.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * SessionRepository
 * Data access layer for scheduled study sessions.
 */
@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    List<Session> findBySubjectId(String subjectId);
    void deleteBySubjectId(String subjectId);
    List<Session> findByTopicId(String topicId);
    List<Session> findAllByOrderByDateAscIdAsc();
}
