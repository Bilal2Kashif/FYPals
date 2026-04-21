package com.fypals.FYPals.deliverable.repository;

import com.fypals.FYPals.deliverable.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
}