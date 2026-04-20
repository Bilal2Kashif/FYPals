package com.fypals.FYPals.team;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_members")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    private MemberRole memberRole;

    private LocalDateTime joinedDate;
    private LocalDateTime dropDate;

    public TeamMember() {}

    // Constructor that TeamService uses
    public TeamMember(Team team, Long userId, MemberRole memberRole) {
        this.team = team;
        this.userId = userId;
        this.memberRole = memberRole;
        this.joinedDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public MemberRole getMemberRole() { return memberRole; }
    public void setMemberRole(MemberRole memberRole) { this.memberRole = memberRole; }

    public LocalDateTime getJoinedDate() { return joinedDate; }
    public void setJoinedDate(LocalDateTime joinedDate) { this.joinedDate = joinedDate; }

    public LocalDateTime getDropDate() { return dropDate; }
    public void setDropDate(LocalDateTime dropDate) { this.dropDate = dropDate; }

    @PrePersist
    protected void onCreate() {
        joinedDate = LocalDateTime.now();
    }
}