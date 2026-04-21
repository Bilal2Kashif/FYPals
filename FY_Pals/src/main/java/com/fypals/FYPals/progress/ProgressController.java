package com.fypals.FYPals.progress;

import com.fypals.FYPals.progress.entity.Checkpoint;
import com.fypals.FYPals.progress.entity.Phase;
import com.fypals.FYPals.progress.repository.CheckpointRepository;
import com.fypals.FYPals.progress.repository.PhaseRepository;
import com.fypals.FYPals.progress.repository.ProjectRepository;
import com.fypals.FYPals.progress.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final ProjectRepository projectRepository;
    private final PhaseRepository phaseRepository;
    private final CheckpointRepository checkpointRepository;

    @GetMapping("/projects/{projectId}/progress")
    @Transactional
    public ResponseEntity<?> getProgress(@PathVariable Long projectId) {
        return projectRepository.findById(projectId).map(p -> {
            Map<String, Object> result = new HashMap<>();
            result.put("id", p.getId());
            result.put("description", p.getDescription());
            result.put("status", p.getStatus());
            result.put("completionPercentage", p.getCompletionPercentage());
            result.put("startDate", p.getStartDate());
            result.put("endDate", p.getEndDate());
            result.put("supervisorId", p.getSupervisorId());
            result.put("teamId", p.getTeam() != null ? p.getTeam().getId() : null);
            result.put("teamName", p.getTeam() != null ? p.getTeam().getTeamName() : null);
            return ResponseEntity.ok((Object) result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/projects/{projectId}/phases")
    @Transactional
    public ResponseEntity<?> addPhase(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        Phase phase = new Phase();
        phase.setName(body.get("name"));
        phase.setStartDate(LocalDate.parse(body.get("startDate")));
        phase.setEndDate(LocalDate.parse(body.get("endDate")));
        Phase saved = progressService.addPhase(projectId, phase);
        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("name", saved.getName());
        result.put("startDate", saved.getStartDate());
        result.put("endDate", saved.getEndDate());
        result.put("projectId", projectId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/projects/{projectId}/phases")
    @Transactional
    public ResponseEntity<?> getPhases(@PathVariable Long projectId) {
        List<Phase> phases = phaseRepository.findByProjectId(projectId);
        List<Map<String, Object>> result = phases.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("startDate", p.getStartDate());
            m.put("endDate", p.getEndDate());
            m.put("projectId", projectId);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/phases/{phaseId}/checkpoints")
    @Transactional
    public ResponseEntity<?> addCheckpoint(
            @PathVariable Long phaseId,
            @RequestBody Map<String, String> body) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Phase not found"));
        Checkpoint cp = new Checkpoint();
        cp.setPhase(phase);
        cp.setTitle(body.get("title"));
        cp.setStatus(body.getOrDefault("status", "PENDING"));
        if (body.get("deadline") != null) {
            cp.setDeadline(LocalDate.parse(body.get("deadline")));
        }
        Checkpoint saved = checkpointRepository.save(cp);
        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("title", saved.getTitle());
        result.put("status", saved.getStatus());
        result.put("deadline", saved.getDeadline());
        result.put("phaseId", phaseId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/phases/{phaseId}/checkpoints")
    @Transactional
    public ResponseEntity<?> getCheckpoints(@PathVariable Long phaseId) {
        List<Checkpoint> cps = checkpointRepository.findByPhaseId(phaseId);
        List<Map<String, Object>> result = cps.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("title", c.getTitle());
            m.put("status", c.getStatus());
            m.put("deadline", c.getDeadline());
            m.put("phaseId", phaseId);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/checkpoints/{checkpointId}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable Long checkpointId,
            @RequestParam String status,
            @RequestParam String callerRole) {
        Checkpoint cp = progressService.updateCheckpointStatus(checkpointId, status, callerRole);
        Map<String, Object> result = new HashMap<>();
        result.put("id", cp.getId());
        result.put("title", cp.getTitle());
        result.put("status", cp.getStatus());
        result.put("deadline", cp.getDeadline());
        return ResponseEntity.ok(result);
    }
}