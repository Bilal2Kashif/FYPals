package com.fypals.FYPals.user.service;

import com.fypals.FYPals.user.dto.ProfileResponse;
import com.fypals.FYPals.user.dto.ProfileUpdateRequest;
import com.fypals.FYPals.user.entity.*;
import com.fypals.FYPals.user.repository.UserRepository;
import com.fypals.FYPals.team.repository.TeamMemberRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public ProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toProfileResponse(user);
    }

    public ProfileResponse getProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return toProfileResponse(user);
    }

    public ProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return toProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateMyProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setName(request.getName());
        user.setBio(request.getBio());
        user.setSkills(request.getSkills());
        user.setProfileComplete(true);

        if (user instanceof Student student) {
            student.setGpa(request.getGpa());
            student.setInterests(request.getInterests());
            student.setPastProjects(request.getPastProjects());
        } else if (user instanceof Advisor advisor) {
            advisor.setDepartment(request.getDepartment());
            advisor.setResearchAreas(request.getResearchAreas());
        } else if (user instanceof FYPStaff staff) {
            staff.setDesignation(request.getDesignation());
        }

        userRepository.save(user);
        return toProfileResponse(user);
    }

    private ProfileResponse toProfileResponse(User user) {
        Long teamId = teamMemberRepository.findByUserId(user.getId())
                .stream()
                .filter(tm -> tm.getDropDate() == null)
                .findFirst()
                .map(tm -> tm.getTeam().getId())
                .orElse(null);

        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .bio(user.getBio())
                .skills(user.getSkills())
                .role(user.getRole())
                .profileComplete(user.isProfileComplete())
                .teamId(teamId);

        if (user instanceof Student s) {
            builder.gpa(s.getGpa())
                    .interests(s.getInterests())
                    .pastProjects(s.getPastProjects());
        } else if (user instanceof Advisor a) {
            builder.department(a.getDepartment())
                    .researchAreas(a.getResearchAreas());
        } else if (user instanceof FYPStaff f) {
            builder.designation(f.getDesignation());
        }

        return builder.build();
    }
}