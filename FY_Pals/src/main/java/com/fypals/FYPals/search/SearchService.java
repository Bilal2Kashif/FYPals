package com.fypals.FYPals.search;

import com.fypals.FYPals.content.entity.Post;
import com.fypals.FYPals.content.repository.PostRepository;
import com.fypals.FYPals.search.dto.SearchResultDTO;
import com.fypals.FYPals.user.entity.User;
import com.fypals.FYPals.user.repository.UserRepository;
import com.fypals.FYPals.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<SearchResultDTO> search(String keyword, String type) {
        List<SearchResultDTO> results = new ArrayList<>();

        if (type == null || type.equalsIgnoreCase("post")) {
            postRepository.searchByKeyword(keyword)
                    .stream()
                    .map(this::postToDTO)
                    .forEach(results::add);
        }

        if (type == null || type.equalsIgnoreCase("student")
                || type.equalsIgnoreCase("user")) {
            userRepository.searchByKeyword(keyword)
                    .stream()
                    .filter(u -> u.getRole() == Role.STUDENT || u.getRole() == Role.ADVISOR)
                    .map(this::userToDTO)
                    .forEach(results::add);
        }

        return results;
    }

    private SearchResultDTO postToDTO(Post post) {
        return SearchResultDTO.builder()
                .id(post.getId())
                .type("post")
                .title(post.getTitle())
                .description(post.getDescription())
                .extra(post.getCategory() != null ? post.getCategory().name() : null)
                .build();
    }

    private SearchResultDTO userToDTO(User user) {
        return SearchResultDTO.builder()
                .id(user.getId())
                .type(user.getRole().name().toLowerCase())
                .title(user.getName())
                .description(user.getSkills())
                .extra(user.getBio())
                .build();
    }
}