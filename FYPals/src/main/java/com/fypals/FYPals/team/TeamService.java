package com.fypals.FYPals.team;

import com.fypals.FYPals.notification.Notification;
import com.fypals.FYPals.notification.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private NotificationRepository notificationRepository;  // ← ADD THIS

    @Transactional
    public Team formTeam(Long userId, String teamName) {
        // Check if user is already in a team
        if (teamMemberRepository.existsByUserId(userId)) {
            throw new RuntimeException("User is already in a team");
        }

        // Create team
        Team team = new Team(teamName, userId);
        team = teamRepository.save(team);

        // Add leader as team member
        TeamMember leaderMember = new TeamMember(team, userId, MemberRole.LEADER);
        teamMemberRepository.save(leaderMember);

        return team;
    }

    // ← ADD THIS METHOD (invite student)
    @Transactional
    public Notification inviteStudent(Long leaderId, Long teamId, Long targetUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getLeaderId().equals(leaderId)) {
            throw new RuntimeException("Only team leader can send invites");
        }

        if (teamMemberRepository.existsByUserId(targetUserId)) {
            throw new RuntimeException("User is already in a team");
        }

        Notification notification = new Notification(targetUserId,
                "You've been invited to join team: " + team.getTeamName(),
                "TEAM_INVITE", teamId);

        return notificationRepository.save(notification);
    }

    public Team getTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }
    @Transactional
    public void dropMember(Long leaderId, Long teamId, Long memberId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getLeaderId().equals(leaderId)) {
            throw new RuntimeException("Only team leader can drop members");
        }

        if (leaderId.equals(memberId)) {
            throw new RuntimeException("Leader cannot drop themselves");
        }

        // Check if member is actually in the team
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found in this team"));

        member.setDropDate(LocalDateTime.now());
        teamMemberRepository.save(member);
        teamMemberRepository.delete(member);

        Notification notification = new Notification(
                memberId,
                "You have been removed from team: " + team.getTeamName(),
                "TEAM_DROPPED",
                teamId
        );
        notificationRepository.save(notification);
    }
}