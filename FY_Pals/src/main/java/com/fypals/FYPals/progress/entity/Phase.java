package com.fypals.FYPals.progress.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "phases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Phase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    /**
     * Which deliverable this phase belongs to.
     * Stored when the phase is created so grouping is permanent
     * and never changes regardless of deliverable status changes.
     * Hibernate ddl-auto=update creates this column automatically.
     */
    @Column(name = "deliverable_id")
    private Long deliverableId;
}