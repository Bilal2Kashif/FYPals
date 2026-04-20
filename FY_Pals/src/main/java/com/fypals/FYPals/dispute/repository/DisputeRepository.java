package com.fypals.FYPals.dispute.repository;

import com.fypals.FYPals.dispute.entity.Dispute;
import com.fypals.FYPals.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByTeamIdAndStatus(Long teamId, DisputeStatus status);
    List<Dispute> findByTeamId(Long teamId);
}