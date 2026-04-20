package com.fypals.FYPals.team.service;

import com.fypals.FYPals.enums.MemberRole;
import com.fypals.FYPals.enums.NotificationType;
import com.fypals.FYPals.enums.TeamStatus;
import com.fypals.FYPals.notification.entity.Notification;
import com.fypals.FYPals.notification.repository.NotificationRepository;
import com.fypals.FYPals.notification.service.NotificationService;
import com.fypals.FYPals.team.entity.Team;
import com.fypals.FYPals.team.entity.TeamMember;
import com.fypals.FYPals.team.repository.TeamMemberRepository;
import com.fypals.FYPals.team.repository.TeamRepository;
import com.fypals.FYPals.user.entity.User;
import com.fypals.FYPals.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final NotificationRepository notificationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Student accepts a team invite.
     * - Validates the notification exists and is a TEAM_INVITE
     * - Validates it belongs to the current user
     * - Validates the user isn't already on a team
     * - Creates a TeamMember row
     * - Marks notification as read
     * - Notifies the team leader
     */
    @Transactional
    public String acceptInvite(String userEmail, Long teamId, Long notificationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Notification notification = validateInviteNotification(user, notificationId, teamId);

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with id: " + teamId));

        // Check that the team is still accepting members
        if (team.getStatus() == TeamStatus.LOCKED || team.getStatus() == TeamStatus.DISSOLVED) {
            throw new IllegalStateException("This team is no longer accepting new members");
        }

        // Check user is not already on this team
        boolean alreadyMember = teamMemberRepository
                .existsByTeamIdAndUserIdAndDropDateIsNull(teamId, user.getId());
        if (alreadyMember) {
            throw new IllegalStateException("You are already a member of this team");
        }

        // Check user is not on any other active team
        boolean onAnotherTeam = teamMemberRepository.findByUserId(user.getId())
                .stream()
                .anyMatch(tm -> tm.getDropDate() == null);
        if (onAnotherTeam) {
            throw new IllegalStateException("You are already on another team. Leave it first before joining a new team.");
        }

        // Create the TeamMember
        TeamMember member = TeamMember.builder()
                .team(team)
                .user(user)
                .memberRole(MemberRole.MEMBER)
                .build();
        teamMemberRepository.save(member);

        // Mark notification as read
        notification.setRead(true);
        notificationRepository.save(notification);

        // Notify the team leader
        notificationService.sendNotification(
                team.getLeader().getId(),
                user.getName() + " accepted your invite to join " + team.getTeamName(),
                NotificationType.TEAM_INVITE,
                teamId
        );

        return "You have joined " + team.getTeamName();
    }

    /**
     * Student declines a team invite.
     * - Marks notification as read
     * - Notifies the team leader
     */
    @Transactional
    public String declineInvite(String userEmail, Long teamId, Long notificationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Notification notification = validateInviteNotification(user, notificationId, teamId);

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with id: " + teamId));

        // Mark notification as read
        notification.setRead(true);
        notificationRepository.save(notification);

        // Notify the team leader
        notificationService.sendNotification(
                team.getLeader().getId(),
                user.getName() + " declined your invite to join " + team.getTeamName(),
                NotificationType.TEAM_INVITE,
                teamId
        );

        return "Invite to " + team.getTeamName() + " declined";
    }

    private Notification validateInviteNotification(User user, Long notificationId, Long teamId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

        // Must belong to the current user
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This notification doesn't belong to you");
        }

        // Must be a team invite type
        if (notification.getType() != NotificationType.TEAM_INVITE
                && notification.getType() != NotificationType.ADVISOR_INVITE) {
            throw new IllegalStateException("This notification is not a team invite");
        }

        // The invite's referenceId must match the teamId in the URL
        if (notification.getReferenceId() == null
                || !notification.getReferenceId().equals(teamId)) {
            throw new IllegalStateException("This invite does not match the given team");
        }

        // Can't accept/decline an already-handled invite
        if (notification.isRead()) {
            throw new IllegalStateException("This invite has already been handled");
        }

        return notification;
    }
}