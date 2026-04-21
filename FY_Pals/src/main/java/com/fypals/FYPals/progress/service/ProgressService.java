package com.fypals.FYPals.progress.service;


import com.fypals.FYPals.progress.entity.*;
import com.fypals.FYPals.progress.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProjectRepository projectRepository;
    private final PhaseRepository phaseRepository;
    private final CheckpointRepository checkpointRepository;

    @Transactional
    public Phase addPhase(Long projectId, Phase phase) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Phase> existing = phaseRepository.findByProjectId(projectId);
        for (Phase p : existing) {
            boolean overlaps = !phase.getEndDate().isBefore(p.getStartDate())
                    && !phase.getStartDate().isAfter(p.getEndDate());
            if (overlaps) {
                throw new RuntimeException("Dates overlap with existing phase: " + p.getName());
            }
        }

        phase.setProject(project);
        return phaseRepository.save(phase);
    }

    @Transactional
    public Checkpoint updateCheckpointStatus(Long checkpointId, String newStatus, String callerRole) {
        Checkpoint cp = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new RuntimeException("Checkpoint not found"));

        if ("COMPLETE".equals(newStatus) && !"LEADER".equals(callerRole)) {
            throw new RuntimeException("Only the team leader can mark a checkpoint as complete");
        }

        cp.setStatus(newStatus);
        checkpointRepository.save(cp);
        recalculateProjectCompletion(cp.getPhase().getProject().getId());
        return cp;
    }

    private void recalculateProjectCompletion(Long projectId) {
        List<Phase> phases = phaseRepository.findByProjectId(projectId);
        long total = 0, completed = 0;
        for (Phase p : phases) {
            List<Checkpoint> cps = checkpointRepository.findByPhaseId(p.getId());
            total += cps.size();
            completed += cps.stream().filter(c -> "COMPLETE".equals(c.getStatus())).count();
        }
        double pct = total == 0 ? 0 : (completed * 100.0 / total);
        Project project = projectRepository.findById(projectId).get();
        project.setCompletionPercentage(pct);
        projectRepository.save(project);
    }
}