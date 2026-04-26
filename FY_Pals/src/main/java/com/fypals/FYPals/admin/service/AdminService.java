package com.fypals.FYPals.admin.service;

import com.fypals.FYPals.admin.dto.AdminPostDTO;
import com.fypals.FYPals.admin.dto.AdminTeamDTO;
import com.fypals.FYPals.admin.dto.AdminUserDTO;
import com.fypals.FYPals.content.entity.Post;
import com.fypals.FYPals.content.repository.PostRepository;
import com.fypals.FYPals.enums.Role;
import com.fypals.FYPals.team.entity.Team;
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

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository       userRepository;
    private final TeamRepository       teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PostRepository       postRepository;
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

        // Instantiate the correct subclass, then set common fields via User setters
        // (setRole, setName, setEmail, setPassword are all on User via @Getter/@Setter)
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
        userRepository.save(user);
    }

    // ── Update role ───────────────────────────────────────────────────────────

    @Transactional
    public void updateUserRole(Long id, String roleStr) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        user.setRole(Role.valueOf(roleStr));
        userRepository.save(user);
    }

    // ── Delete user ───────────────────────────────────────────────────────────

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
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
        return AdminPostDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .category(post.getCategory())
                .authorId(post.getAuthorId())
                .voteCount(post.getVoteCount())
                .commentCount(post.getCommentCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}