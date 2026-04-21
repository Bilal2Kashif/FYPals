package com.fypals.FYPals.deliverable;

import com.fypals.FYPals.deliverable.entity.Deliverable;
import com.fypals.FYPals.deliverable.entity.Feedback;
import com.fypals.FYPals.deliverable.repository.DeliverableRepository;
import com.fypals.FYPals.deliverable.service.DeliverableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/deliverables")
@RequiredArgsConstructor
public class DeliverableController {

    private final DeliverableService deliverableService;
    private final DeliverableRepository deliverableRepository;

    @GetMapping
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> listDeliverables() {
        return ResponseEntity.ok(
                deliverableRepository.findAll().stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/project/{projectId}")
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(
                deliverableRepository.findByProjectId(projectId).stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())
        );
    }

    @PostMapping("/{id}/submit")
    @Transactional
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Deliverable d = deliverableService.submit(id, body.get("googleDriveLink"));
        return ResponseEntity.ok(toMap(d));
    }

    @PostMapping("/{id}/feedback")
    @Transactional
    public ResponseEntity<Map<String, Object>> feedback(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Feedback fb = deliverableService.giveFeedback(
                id,
                body.get("comment"),
                body.get("decision"),
                body.get("callerRole"));
        Map<String, Object> result = new HashMap<>();
        result.put("id", fb.getId());
        result.put("comment", fb.getComment());
        result.put("decision", fb.getDecision());
        result.put("createdAt", fb.getCreatedAt());
        result.put("deliverableId", id);
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> toMap(Deliverable d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId());
        m.put("title", d.getTitle());
        m.put("deadline", d.getDeadline());
        m.put("status", d.getStatus());
        m.put("submittedAt", d.getSubmittedAt());
        m.put("googleDriveLink", d.getGoogleDriveLink());
        m.put("reminderSent", d.isReminderSent());
        m.put("projectId", d.getProject() != null ? d.getProject().getId() : null);
        m.put("submittedById", d.getSubmittedBy() != null ? d.getSubmittedBy().getId() : null);
        return m;
    }
}