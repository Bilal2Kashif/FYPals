package com.fypals.FYPals.progress.repository;

import com.fypals.FYPals.progress.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByTeamId(Long teamId);
}