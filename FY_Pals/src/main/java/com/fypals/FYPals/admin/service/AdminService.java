package com.fypals.FYPals.admin.service;

import com.fypals.FYPals.admin.dto.AdminPostDTO;
import com.fypals.FYPals.admin.dto.AdminTeamDTO;
import com.fypals.FYPals.admin.dto.AdminUserDTO;
import com.fypals.FYPals.content.entity.Post;
import com.fypals.FYPals.content.repository.CommentRepository;
import com.fypals.FYPals.content.repository.PostRepository;
import com.fypals.FYPals.content.repository.VoteRepository;
import com.fypals.FYPals.deliverable.repository.DeliverableRepository;
import com.fypals.FYPals.dispute.repository.DisputeRepository;
import com.fypals.FYPals.enums.Role;
import com.fypals.FYPals.notification.repository.NotificationRepository;
import com.fypals.FYPals.progress.repository.ProjectRepository;
import com.fypals.FYPals.team.entity.Team;
import com.fypals.FYPals.team.entity.TeamMember;
import com.fypals.FYPals.team.repository.TeamMemberRepository;
import com.fypals.FYPals.team.repository.TeamRepository;
import com.fypals.FYPals.user.entity.*;
import com.fypals.FYPals.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository       userRepository;
    private final TeamRepository       teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PostRepository       postRepository;
    private final CommentRepository    commentRepository;
    private final VoteRepository       voteRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectRepository    projectRepository;
    private final DeliverableRepository deliverableRepository;
    private final DisputeRepository    disputeRepository;
    private final PasswordEncoder      passwordEncoder;

    // ── Read ──────────────────────────────────────────────────────────────────

    public Page<AdminUserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toAdminUserDTO);
    }

    public AdminUserDTO getUserById(Long id) {
        return toAdminUserDTO(userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id)));
    }

    @Transactional
    public Page<AdminTeamDTO> getAllTeams(Pageable pageable) {
        return teamRepository.findAll(pageable).map(this::toAdminTeamDTO);
    }

    public Page<AdminPostDTO> getAllPosts(Pageable pageable) {
        return postRepository.findAll(pageable).map(this::toAdminPostDTO);
    }

    // ── Create user ───────────────────────────────────────────────────────────

    @Transactional
    public void createUser(String name, String email, String password, String roleStr) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }
        Role role = Role.valueOf(roleStr);
        String hashed = passwordEncoder.encode(password);

        User user = switch (role) {
            case STUDENT   -> new Student();
            case ADVISOR   -> new Advisor();
            case FYP_STAFF -> new FYPStaff();
            case ADMIN     -> new Admin();
        };

        user.setRole(role);
        user.setName(name);
        user.setEmail(email);
        user.setPassword(hashed);

        // Admins are always profile-complete; others must fill their profiles
        user.setProfileComplete(role == Role.ADMIN);

        userRepository.save(user);
    }

    // ── Update role ───────────────────────────────────────────────────────────

    @Transactional
    public void updateUserRole(Long id, String roleStr) {
        User oldUser = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        Role newRole = Role.valueOf(roleStr);
        if (oldUser.getRole() == newRole) return;

        userRepository.updateDtype(id, newRole.name());
        oldUser.setRole(newRole);
        // If changing TO admin, mark profile complete automatically
        if (newRole == Role.ADMIN) {
            oldUser.setProfileComplete(true);
        }
        userRepository.save(oldUser);
    }

    // ── Delete user ───────────────────────────────────────────────────────────

    @Transactional
    public void deleteUser(Long id, Long requestingAdminId) {
        if (id.equals(requestingAdminId)) {
            throw new RuntimeException("You cannot delete your own account");
        }
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found: " + id);
        }

        List<Team> ledTeams = teamRepository.findByLeaderId(id);
        for (Team team : ledTeams) {
            deleteTeamInternal(team.getId());
        }

        List<TeamMember> memberships = teamMemberRepository.findByUserId(id);
        teamMemberRepository.deleteAll(memberships);

        List<Post> userPosts = postRepository.findByAuthorId(id);
        for (Post post : userPosts) {
            voteRepository.deleteByPostId(post.getId());
            commentRepository.deleteByPostId(post.getId());
        }
        postRepository.deleteAll(userPosts);

        notificationRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    // ── Delete team ───────────────────────────────────────────────────────────

    @Transactional
    public void deleteTeam(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new EntityNotFoundException("Team not found: " + teamId);
        }
        deleteTeamInternal(teamId);
    }

    private void deleteTeamInternal(Long teamId) {
        disputeRepository.deleteByTeamId(teamId);
        projectRepository.findByTeamId(teamId).ifPresent(project -> {
            deliverableRepository.deleteByProjectId(project.getId());
            projectRepository.delete(project);
        });
        teamMemberRepository.deleteByTeamId(teamId);
        teamRepository.deleteById(teamId);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AdminUserDTO toAdminUserDTO(User user) {
        return AdminUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .profileComplete(user.isProfileComplete())
                .skills(user.getSkills())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminTeamDTO toAdminTeamDTO(Team team) {
        int memberCount = teamMemberRepository.countByTeamId(team.getId());
        return AdminTeamDTO.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .leaderName(team.getLeader().getName())
                .leaderId(team.getLeader().getId())
                .status(team.getStatus())
                .memberCount(memberCount)
                .createdAt(team.getCreatedAt())
                .build();
    }

    private AdminPostDTO toAdminPostDTO(Post post) {
        // Look up the author name from userId — the Post entity only stores authorId
        String authorName = userRepository.findById(post.getAuthorId())
                .map(u -> u.getName())
                .orElse("Unknown");
        return AdminPostDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .category(post.getCategory())
                .authorId(post.getAuthorId())
                .authorName(authorName)
                .voteCount(post.getVoteCount())
                .commentCount(post.getCommentCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}