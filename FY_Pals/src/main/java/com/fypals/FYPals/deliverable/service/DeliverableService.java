package com.fypals.FYPals.deliverable.service;

import com.fypals.FYPals.deliverable.entity.Deliverable;
import com.fypals.FYPals.deliverable.entity.Feedback;
import com.fypals.FYPals.deliverable.repository.DeliverableRepository;
import com.fypals.FYPals.deliverable.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DeliverableService {

    private final DeliverableRepository deliverableRepository;
    private final FeedbackRepository feedbackRepository;

    public Deliverable submit(Long deliverableId, String driveLink) {
        Deliverable d = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found: " + deliverableId));
        if (java.time.LocalDate.now().isAfter(d.getDeadline())) {
            throw new RuntimeException("Submission deadline has passed");
        }
        d.setGoogleDriveLink(driveLink);
        d.setStatus("SUBMITTED");
        d.setSubmittedAt(java.time.LocalDateTime.now());
        return deliverableRepository.save(d);
    }

    public Feedback giveFeedback(Long deliverableId, String comment,
                                 String decision, String callerRole) {
        Deliverable d = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found"));
        Feedback fb = new Feedback();
        fb.setDeliverable(d);
        fb.setComment(comment);
        if ("ADVISOR".equals(callerRole)) {
            if (decision == null || decision.isBlank()) {
                throw new RuntimeException("Advisor must provide a decision: APPROVED or CHANGES_REQUESTED");
            }
            fb.setDecision(decision);
            d.setStatus(decision);
            deliverableRepository.save(d);
        }
        return feedbackRepository.save(fb);
    }
}