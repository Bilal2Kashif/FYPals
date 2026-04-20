package com.fypals.FYPals.admin.service;

import com.fypals.FYPals.admin.dto.AdminPostDTO;
import com.fypals.FYPals.admin.dto.AdminTeamDTO;
import com.fypals.FYPals.admin.dto.AdminUserDTO;
import com.fypals.FYPals.content.entity.Post;
import com.fypals.FYPals.content.repository.PostRepository;
import com.fypals.FYPals.team.entity.Team;
import com.fypals.FYPals.team.repository.TeamRepository;
import com.fypals.FYPals.user.entity.User;
import com.fypals.FYPals.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PostRepository postRepository;

    public Page<AdminUserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toAdminUserDTO);
    }

    public AdminUserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        return toAdminUserDTO(user);
    }


    @Transactional
    public Page<AdminTeamDTO> getAllTeams(Pageable pageable) {
        return teamRepository.findAll(pageable)
                .map(this::toAdminTeamDTO);
    }

    public Page<AdminPostDTO> getAllPosts(Pageable pageable) {
        return postRepository.findAll(pageable)
                .map(this::toAdminPostDTO);
    }

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
        return AdminTeamDTO.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .leaderName(team.getLeader().getName())
                .leaderId(team.getLeader().getId())
                .status(team.getStatus())
                .memberCount(team.getMembers().size())
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