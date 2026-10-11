package com.studypilot.repository;

import com.studypilot.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * SubjectRepository
 * Data access layer for Subject and associated units/topics.
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {
}
