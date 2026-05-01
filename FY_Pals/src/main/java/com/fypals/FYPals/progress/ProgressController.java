package com.fypals.FYPals.progress;

import com.fypals.FYPals.progress.entity.Checkpoint;
import com.fypals.FYPals.progress.entity.Phase;
import com.fypals.FYPals.progress.repository.CheckpointRepository;
import com.fypals.FYPals.progress.repository.PhaseRepository;
import com.fypals.FYPals.progress.repository.ProjectRepository;
import com.fypals.FYPals.progress.service.ProgressService;
import com.fypals.FYPals.user.entity.User;
import com.fypals.FYPals.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService      progressService;
    private final ProjectRepository    projectRepository;
    private final PhaseRepository      phaseRepository;
    private final CheckpointRepository checkpointRepository;
    private final UserRepository       userRepository;

    @GetMapping("/projects/{projectId}/progress")
    @Transactional
    public ResponseEntity<?> getProgress(@PathVariable Long projectId) {
        return projectRepository.findById(projectId).map(p -> {
            Map<String, Object> result = new HashMap<>();
            result.put("id",                   p.getId());
            result.put("description",          p.getDescription());
            result.put("projectName",          p.getProjectName());
            result.put("status",               p.getStatus());
            result.put("completionPercentage", p.getCompletionPercentage());
            result.put("startDate",            p.getStartDate());
            result.put("endDate",              p.getEndDate());
            result.put("supervisorId",         p.getSupervisorId());
            result.put("teamId",               p.getTeam() != null ? p.getTeam().getId() : null);
            result.put("teamName",             p.getTeam() != null ? p.getTeam().getTeamName() : null);
            return ResponseEntity.ok((Object) result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/projects/{projectId}/progress")
    @Transactional
    public ResponseEntity<?> updateProjectDetails(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        return projectRepository.findById(projectId).map(p -> {
            if (body.get("description") != null) p.setDescription(body.get("description"));
            if (body.get("projectName")  != null) p.setProjectName(body.get("projectName"));
            projectRepository.save(p);
            Map<String, Object> result = new HashMap<>();
            result.put("id",          p.getId());
            result.put("description", p.getDescription());
            result.put("projectName", p.getProjectName());
            result.put("message",     "Project updated successfully");
            return ResponseEntity.ok((Object) result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/projects/{projectId}/supervisor")
    @Transactional
    public ResponseEntity<?> assignSupervisor(@PathVariable Long projectId, @RequestParam Long advisorId) {
        return projectRepository.findById(projectId).map(p -> {
            p.setSupervisorId(advisorId);
            projectRepository.save(p);
            return ResponseEntity.ok(Map.of("message", "Supervisor assigned", "advisorId", advisorId));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/advisor/teams")
    @Transactional
    public ResponseEntity<?> getAdvisorTeams(@AuthenticationPrincipal UserDetails userDetails) {
        Long advisorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
        List<Map<String, Object>> result = projectRepository.findBySupervisorId(advisorId).stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",          p.getTeam().getId());
                    m.put("teamName",    p.getTeam().getTeamName());
                    m.put("status",      p.getTeam().getStatus());
                    Map<String, Object> proj = new HashMap<>();
                    proj.put("id",          p.getId());
                    proj.put("projectName", p.getProjectName());
                    proj.put("description", p.getDescription());
                    m.put("project",     proj);
                    m.put("memberCount", p.getTeam().getMembers().size());
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/projects/{projectId}/phases")
    @Transactional
    public ResponseEntity<?> addPhase(@PathVariable Long projectId, @RequestBody Map<String, String> body) {
        if (body.get("startDate") == null || body.get("endDate") == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        LocalDate startDate = LocalDate.parse(body.get("startDate"));
        LocalDate endDate   = LocalDate.parse(body.get("endDate"));

        // FIX 10: Validate start date is not strictly before today isn't required
        // (past dates are allowed so advisors can set historical phases)
        // BUT end date must be after start date
        if (!startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        Phase phase = new Phase();
        phase.setName(body.get("name"));
        phase.setStartDate(startDate);
        phase.setEndDate(endDate);
        Phase saved = progressService.addPhase(projectId, phase);
        Map<String, Object> result = new HashMap<>();
        result.put("id",        saved.getId());
        result.put("name",      saved.getName());
        result.put("startDate", saved.getStartDate());
        result.put("endDate",   saved.getEndDate());
        result.put("projectId", projectId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/projects/{projectId}/phases")
    @Transactional
    public ResponseEntity<?> getPhases(@PathVariable Long projectId) {
        List<Phase> phases = phaseRepository.findByProjectId(projectId);
        return ResponseEntity.ok(phases.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",        p.getId());
            m.put("name",      p.getName());
            m.put("startDate", p.getStartDate());
            m.put("endDate",   p.getEndDate());
            m.put("projectId", projectId);
            return m;
        }).toList());
    }

    @PostMapping("/phases/{phaseId}/checkpoints")
    @Transactional
    public ResponseEntity<?> addCheckpoint(@PathVariable Long phaseId, @RequestBody Map<String, String> body) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Phase not found"));

        String title = body.get("title");
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Checkpoint title cannot be empty");
        }

        Checkpoint cp = new Checkpoint();
        cp.setPhase(phase);
        cp.setTitle(title.trim());
        cp.setStatus("TODO");

        if (body.get("deadline") != null && !body.get("deadline").isEmpty()) {
            cp.setDeadline(LocalDate.parse(body.get("deadline")));
        }
        if (body.get("assignedToId") != null && !body.get("assignedToId").isEmpty()) {
            userRepository.findById(Long.valueOf(body.get("assignedToId"))).ifPresent(cp::setAssignedTo);
        }

        Checkpoint saved = checkpointRepository.save(cp);
        return ResponseEntity.ok(toCheckpointMap(saved, phaseId));
    }

    @GetMapping("/phases/{phaseId}/checkpoints")
    @Transactional
    public ResponseEntity<?> getCheckpoints(@PathVariable Long phaseId) {
        return ResponseEntity.ok(
                checkpointRepository.findByPhaseId(phaseId).stream()
                        .map(c -> toCheckpointMap(c, phaseId))
                        .toList()
        );
    }

    @PutMapping("/checkpoints/{checkpointId}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable Long checkpointId,
            @RequestParam String status,
            @RequestParam String callerRole) {
        Checkpoint cp = progressService.updateCheckpointStatus(checkpointId, status, callerRole);
        return ResponseEntity.ok(toCheckpointMap(cp, cp.getPhase().getId()));
    }

    @PutMapping("/checkpoints/{checkpointId}/assign")
    @Transactional
    public ResponseEntity<?> assignCheckpoint(@PathVariable Long checkpointId, @RequestParam Long assignedToId) {
        Checkpoint cp = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new RuntimeException("Checkpoint not found"));
        User assignee = userRepository.findById(assignedToId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        cp.setAssignedTo(assignee);
        checkpointRepository.save(cp);
        return ResponseEntity.ok(toCheckpointMap(cp, cp.getPhase().getId()));
    }

    private Map<String, Object> toCheckpointMap(Checkpoint c, Long phaseId) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",             c.getId());
        m.put("title",          c.getTitle());
        m.put("status",         c.getStatus());
        m.put("deadline",       c.getDeadline());
        m.put("phaseId",        phaseId);
        m.put("assignedToId",   c.getAssignedTo() != null ? c.getAssignedTo().getId()   : null);
        m.put("assignedToName", c.getAssignedTo() != null ? c.getAssignedTo().getName() : null);
        return m;
    }
}