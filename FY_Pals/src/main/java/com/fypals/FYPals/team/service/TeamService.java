package com.fypals.FYPals.team.service;

import com.fypals.FYPals.enums.MemberRole;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Team formTeam(Long userId, String teamName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        boolean alreadyInTeam = teamMemberRepository.findByUserId(userId)
                .stream().anyMatch(tm -> tm.getDropDate() == null);
        if (alreadyInTeam) {
            throw new RuntimeException("User is already in a team");
        }

        Team team = Team.builder()
                .teamName(teamName)
                .leader(user)
                .status(TeamStatus.FORMING)
                .build();
        team = teamRepository.save(team);

        TeamMember leaderMember = TeamMember.builder()
                .team(team)
                .user(user)
                .memberRole(MemberRole.LEADER)
                .build();
        teamMemberRepository.save(leaderMember);

        return team;
    }

    @Transactional
    public Notification inviteStudent(Long leaderId, Long teamId, Long targetUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found"));

        if (!team.getLeader().getId().equals(leaderId)) {
            throw new RuntimeException("Only team leader can send invites");
        }

        boolean alreadyInTeam = teamMemberRepository.findByUserId(targetUserId)
                .stream().anyMatch(tm -> tm.getDropDate() == null);
        if (alreadyInTeam) {
            throw new RuntimeException("User is already in a team");
        }

        return notificationService.sendNotification(
                targetUserId,
                "You've been invited to join team: " + team.getTeamName(),
                "TEAM_INVITE",
                teamId
        );
    }


    @Transactional
    public Map<String, Object> getTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found"));
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", team.getId());
        result.put("teamName", team.getTeamName());
        result.put("status", team.getStatus());
        result.put("leaderId", team.getLeader().getId());
        result.put("leaderName", team.getLeader().getName());
        result.put("memberCount", team.getMembers().size());
        return result;
    }

    @Transactional
    public void dropMember(Long leaderId, Long teamId, Long memberId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found"));

        if (!team.getLeader().getId().equals(leaderId)) {
            throw new RuntimeException("Only team leader can drop members");
        }
        if (leaderId.equals(memberId)) {
            throw new RuntimeException("Leader cannot drop themselves");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found in this team"));

        teamMemberRepository.delete(member);

        notificationService.sendNotification(
                memberId,
                "You have been removed from team: " + team.getTeamName(),
                "TEAM_DROPPED",   // ← correct
                teamId
        );
    }
}