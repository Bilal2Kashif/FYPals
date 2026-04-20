package com.fypals.FYPals.dispute;

import com.fypals.FYPals.notification.Notification;
import com.fypals.FYPals.notification.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DisputeService {

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private PollRepository pollRepository;

    @Autowired
    private PollVoteRepository pollVoteRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Raise a dispute (UC-7)
    @Transactional
    public Dispute raiseDispute(Long teamId, Long raisedBy, String targetItem, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Reason cannot be empty");
        }

        Dispute dispute = new Dispute(teamId, raisedBy, targetItem, reason);
        Dispute savedDispute = disputeRepository.save(dispute);

        // Notify team leader (leaderId needs to be fetched - assuming leaderId = team leader)
        // For now, notify all team members? This will be refined when Auth is ready

        return savedDispute;
    }

    // Get pending disputes for a team (for leader)
    public List<Dispute> getPendingDisputes(Long teamId) {
        return disputeRepository.findByTeamIdAndStatus(teamId, DisputeStatus.PENDING);
    }

    // Reject dispute (UC-7)
    @Transactional
    public Dispute rejectDispute(Long disputeId, Long leaderId, String rejectionReason) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));

        // TODO: Verify leaderId is actually leader of the team
        // if (!isTeamLeader(leaderId, dispute.getTeamId())) throw...

        dispute.setStatus(DisputeStatus.REJECTED);
        dispute.setRejectionReason(rejectionReason);
        dispute.setResolvedAt(LocalDateTime.now());
        dispute.setResolvedByDispute(leaderId);

        Dispute savedDispute = disputeRepository.save(dispute);

        // Notify raiser
        Notification notification = new Notification(
                dispute.getRaisedBy(),
                "Your dispute about '" + dispute.getTargetItem() + "' was rejected. Reason: " + rejectionReason,
                "DISPUTE_REJECTED",
                disputeId
        );
        notificationRepository.save(notification);

        return savedDispute;
    }

    // Accept dispute and create poll (UC-7)
    @Transactional
    public Poll acceptDisputeAndCreatePoll(Long disputeId, Long leaderId, String question, String options, LocalDateTime deadline) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));

        // TODO: Verify leaderId is actually leader of the team

        dispute.setStatus(DisputeStatus.OPEN);
        disputeRepository.save(dispute);

        Poll poll = new Poll(disputeId, question, leaderId, options, deadline);
        return pollRepository.save(poll);
    }

    // Get poll for a dispute
    public Poll getPollByDispute(Long disputeId) {
        return pollRepository.findByDisputeId(disputeId)
                .orElseThrow(() -> new RuntimeException("Poll not found for this dispute"));
    }

    // Vote on poll (UC-7)
    @Transactional
    public PollVote voteOnPoll(Long pollId, Long voterId, String chosenOption) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        // Check if deadline passed
        if (poll.getDeadline() != null && LocalDateTime.now().isAfter(poll.getDeadline())) {
            throw new RuntimeException("Voting deadline has passed");
        }

        // Check if already voted
        java.util.Optional<PollVote> existingVote = pollVoteRepository.findByPollIdAndVoterId(pollId, voterId);
        if (existingVote.isPresent()) {
            throw new RuntimeException("You have already voted on this poll");
        }

        PollVote vote = new PollVote(pollId, voterId, chosenOption);
        return pollVoteRepository.save(vote);
    }

    // Get poll results (UC-7)
    public Map<String, Long> getPollResults(Long pollId) {
        List<PollVote> votes = pollVoteRepository.findByPollId(pollId);

        return votes.stream()
                .collect(Collectors.groupingBy(PollVote::getChosenOption, Collectors.counting()));
    }

    // Get dispute by ID
    public Dispute getDispute(Long disputeId) {
        return disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
    }
}