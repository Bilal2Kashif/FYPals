package com.fypals.FYPals.dispute;

import com.fypals.FYPals.dispute.entity.Dispute;
import com.fypals.FYPals.dispute.entity.Poll;
import com.fypals.FYPals.dispute.entity.PollVote;
import com.fypals.FYPals.dispute.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    public ResponseEntity<?> raiseDispute(@RequestBody Map<String, Object> body) {
        Long teamId = Long.valueOf(body.get("teamId").toString());
        Long raisedBy = Long.valueOf(body.get("raisedBy").toString());
        String targetItem = body.get("targetItem").toString();
        String reason = body.get("reason").toString();
        Dispute dispute = disputeService.raiseDispute(teamId, raisedBy, targetItem, reason);
        return ResponseEntity.ok(Map.of("success", true, "data", dispute));
    }

    @GetMapping("/team/{teamId}/pending")
    public ResponseEntity<?> getPendingDisputes(@PathVariable Long teamId) {
        List<Dispute> disputes = disputeService.getPendingDisputes(teamId);
        return ResponseEntity.ok(Map.of("success", true, "data", disputes));
    }

    @GetMapping("/team/{teamId}/all")
    public ResponseEntity<?> getAllDisputes(@PathVariable Long teamId) {
        List<Dispute> disputes = disputeService.getAllDisputes(teamId);
        return ResponseEntity.ok(Map.of("success", true, "data", disputes));
    }

    @PostMapping("/{disputeId}/reject")
    public ResponseEntity<?> rejectDispute(
            @PathVariable Long disputeId,
            @RequestBody Map<String, Object> body) {
        Long leaderId = Long.valueOf(body.get("leaderId").toString());
        String rejectionReason = body.get("rejectionReason").toString();
        Dispute dispute = disputeService.rejectDispute(disputeId, leaderId, rejectionReason);
        return ResponseEntity.ok(Map.of("success", true, "data", dispute));
    }

    @PostMapping("/{disputeId}/accept")
    public ResponseEntity<?> acceptDisputeAndCreatePoll(
            @PathVariable Long disputeId,
            @RequestBody Map<String, Object> body) {
        Long leaderId = Long.valueOf(body.get("leaderId").toString());
        String question = body.get("question").toString();
        String options = body.get("options").toString();
        LocalDateTime deadline = LocalDateTime.parse(body.get("deadline").toString());
        Poll poll = disputeService.acceptDisputeAndCreatePoll(disputeId, leaderId, question, options, deadline);
        return ResponseEntity.ok(Map.of("success", true, "data", poll));
    }

    @GetMapping("/{disputeId}/poll")
    public ResponseEntity<?> getPoll(@PathVariable Long disputeId) {
        Poll poll = disputeService.getPollByDispute(disputeId);
        return ResponseEntity.ok(Map.of("success", true, "data", poll));
    }

    @PostMapping("/{disputeId}/polls/{pollId}/vote")
    public ResponseEntity<?> voteOnPoll(
            @PathVariable Long disputeId,
            @PathVariable Long pollId,
            @RequestBody Map<String, Object> body) {
        Long voterId = Long.valueOf(body.get("voterId").toString());
        String chosenOption = body.get("chosenOption").toString();
        PollVote vote = disputeService.voteOnPoll(pollId, voterId, chosenOption);
        return ResponseEntity.ok(Map.of("success", true, "data", vote));
    }

    @GetMapping("/{disputeId}/polls/{pollId}/results")
    public ResponseEntity<?> getPollResults(
            @PathVariable Long disputeId,
            @PathVariable Long pollId) {
        Map<String, Long> results = disputeService.getPollResults(pollId);
        return ResponseEntity.ok(Map.of("success", true, "data", results));
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<?> getDispute(@PathVariable Long disputeId) {
        Dispute dispute = disputeService.getDispute(disputeId);
        return ResponseEntity.ok(Map.of("success", true, "data", dispute));
    }
}