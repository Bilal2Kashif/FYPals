package com.fypals.FYPals.dispute;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    List<Dispute> findByTeamId(Long teamId);

    List<Dispute> findByTeamIdAndStatus(Long teamId, DisputeStatus status);

    List<Dispute> findByRaisedBy(Long raisedBy);
}