package com.fypals.FYPals.progress.entity;

import com.fypals.FYPals.team.entity.Team;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String status;

    private Long supervisorId;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private double completionPercentage = 0.0;
}