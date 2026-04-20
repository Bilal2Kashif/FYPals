package com.fypals.FYPals.dispute;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/disputes")
public class DisputeController {

    @Autowired
    private DisputeService disputeService;

    // Raise a dispute (UC-7)
    @PostMapping
    public ResponseEntity<?> raiseDispute(@RequestParam Long teamId,
                                          @RequestParam Long raisedBy,
                                          @RequestParam String targetItem,
                                          @RequestParam String reason) {
        try {
            Dispute dispute = disputeService.raiseDispute(teamId, raisedBy, targetItem, reason);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dispute);
            response.put("message", "Dispute raised successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get pending disputes for a team (leader view)
    @GetMapping("/team/{teamId}/pending")
    public ResponseEntity<?> getPendingDisputes(@PathVariable Long teamId) {
        try {
            List<Dispute> disputes = disputeService.getPendingDisputes(teamId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", disputes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Reject dispute (UC-7)
    @PostMapping("/{disputeId}/reject")
    public ResponseEntity<?> rejectDispute(@PathVariable Long disputeId,
                                           @RequestParam Long leaderId,
                                           @RequestParam String rejectionReason) {
        try {
            Dispute dispute = disputeService.rejectDispute(disputeId, leaderId, rejectionReason);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dispute);
            response.put("message", "Dispute rejected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Accept dispute and create poll (UC-7)
    @PostMapping("/{disputeId}/accept")
    public ResponseEntity<?> acceptDisputeAndCreatePoll(@PathVariable Long disputeId,
                                                        @RequestParam Long leaderId,
                                                        @RequestParam String question,
                                                        @RequestParam String options,
                                                        @RequestParam LocalDateTime deadline) {
        try {
            Poll poll = disputeService.acceptDisputeAndCreatePoll(disputeId, leaderId, question, options, deadline);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", poll);
            response.put("message", "Dispute accepted. Poll created.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get poll for dispute
    @GetMapping("/{disputeId}/poll")
    public ResponseEntity<?> getPoll(@PathVariable Long disputeId) {
        try {
            Poll poll = disputeService.getPollByDispute(disputeId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", poll);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Vote on poll (UC-7)
    @PostMapping("/polls/{pollId}/vote")
    public ResponseEntity<?> voteOnPoll(@PathVariable Long pollId,
                                        @RequestParam Long voterId,
                                        @RequestParam String chosenOption) {
        try {
            PollVote vote = disputeService.voteOnPoll(pollId, voterId, chosenOption);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", vote);
            response.put("message", "Vote recorded");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get poll results (UC-7)
    @GetMapping("/polls/{pollId}/results")
    public ResponseEntity<?> getPollResults(@PathVariable Long pollId) {
        try {
            Map<String, Long> results = disputeService.getPollResults(pollId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", results);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get dispute details
    @GetMapping("/{disputeId}")
    public ResponseEntity<?> getDispute(@PathVariable Long disputeId) {
        try {
            Dispute dispute = disputeService.getDispute(disputeId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dispute);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}