package com.fypals.FYPals.team.repository;

import com.fypals.FYPals.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
}