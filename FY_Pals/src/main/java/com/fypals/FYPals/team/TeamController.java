package com.fypals.FYPals.team;

import com.fypals.FYPals.team.entity.Team;
import com.fypals.FYPals.team.service.TeamService;
import com.fypals.FYPals.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> formTeam(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String teamName) {
        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        Team team = teamService.formTeam(userId, teamName);
        return ResponseEntity.ok(Map.of("message", "Team created", "teamId", team.getId(), "teamName", team.getTeamName()));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getTeam(teamId));
    }

    @PostMapping("/{teamId}/invite-student")
    public ResponseEntity<?> inviteStudent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long teamId,
            @RequestParam Long targetUserId) {
        Long leaderId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        teamService.inviteStudent(leaderId, teamId, targetUserId);
        return ResponseEntity.ok(Map.of("message", "Invite sent successfully"));
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<?> dropMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        Long leaderId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        teamService.dropMember(leaderId, teamId, memberId);
        return ResponseEntity.ok(Map.of("message", "Member dropped successfully"));
    }
}