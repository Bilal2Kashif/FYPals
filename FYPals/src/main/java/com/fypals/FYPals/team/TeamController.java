package com.fypals.FYPals.team;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @PostMapping
    public ResponseEntity<?> formTeam(@RequestParam Long userId,
                                      @RequestParam String teamName) {
        try {
            Team team = teamService.formTeam(userId, teamName);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", team);
            response.put("message", "Team created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId) {
        try {
            Team team = teamService.getTeam(teamId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", team);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<?> dropMember(@RequestParam Long leaderId,
                                        @PathVariable Long teamId,
                                        @PathVariable Long memberId) {
        try {
            teamService.dropMember(leaderId, teamId, memberId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Member dropped successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}