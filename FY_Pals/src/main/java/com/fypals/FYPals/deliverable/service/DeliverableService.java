package com.fypals.FYPals.deliverable.service;

import com.fypals.FYPals.deliverable.entity.Deliverable;
import com.fypals.FYPals.deliverable.entity.Feedback;
import com.fypals.FYPals.deliverable.repository.DeliverableRepository;
import com.fypals.FYPals.deliverable.repository.FeedbackRepository;
import com.fypals.FYPals.notification.service.NotificationService;
import com.fypals.FYPals.progress.entity.Project;
import com.fypals.FYPals.progress.repository.ProjectRepository;
import com.fypals.FYPals.team.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DeliverableService {

    private final DeliverableRepository deliverableRepository;
    private final FeedbackRepository feedbackRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final TeamMemberRepository teamMemberRepository;

    public Deliverable createDeliverable(Long projectId, String title, String deadline) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        Deliverable d = new Deliverable();
        d.setProject(project);
        d.setTitle(title);
        d.setDeadline(LocalDate.parse(deadline));
        d.setStatus("PENDING");
        return deliverableRepository.save(d);
    }

    public Deliverable submit(Long deliverableId, String driveLink) {
        Deliverable d = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found: " + deliverableId));
        if (LocalDate.now().isAfter(d.getDeadline())) {
            throw new RuntimeException("Submission deadline has passed");
        }
        d.setGoogleDriveLink(driveLink);
        d.setStatus("SUBMITTED");
        d.setSubmittedAt(LocalDateTime.now());
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

        Feedback saved = feedbackRepository.save(fb);

        // Notify all team members about the feedback
        if (d.getProject() != null && d.getProject().getTeam() != null) {
            Long teamId = d.getProject().getTeam().getId();
            String msg = decision != null
                    ? "Your deliverable '" + d.getTitle() + "' received feedback: " + decision
                    : "Your deliverable '" + d.getTitle() + "' received a staff comment";
            teamMemberRepository.findByTeamId(teamId).forEach(member -> {
                notificationService.sendNotification(
                        member.getUser().getId(),
                        msg,
                        "DELIVERABLE_FEEDBACK",
                        deliverableId
                );
            });
        }

        return saved;
    }
}