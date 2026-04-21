package com.fypals.FYPals.content;

import com.fypals.FYPals.content.entity.Comment;
import com.fypals.FYPals.content.entity.Post;
import com.fypals.FYPals.content.service.ContentService;
import com.fypals.FYPals.enums.PostCategory;
import com.fypals.FYPals.enums.VoteType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.fypals.FYPals.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        String title = body.get("title").toString();
        String description = body.get("description").toString();
        PostCategory category = PostCategory.valueOf(body.get("category").toString());
        Post post = contentService.createPost(authorId, title, description, category);
        return ResponseEntity.ok(Map.of("id", post.getId(), "title", post.getTitle(),
                "description", post.getDescription(), "authorId", post.getAuthorId()));
    }

    @GetMapping
    public ResponseEntity<Page<Post>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy) {
        return ResponseEntity.ok(contentService.getAllPosts(page, size, sortBy));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId) {
        Post post = contentService.getPost(postId);
        List<Comment> comments = contentService.getCommentsByPost(postId);
        return ResponseEntity.ok(Map.of("post", post, "comments", comments));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<Post>> getPostsByCategory(
            @PathVariable PostCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(contentService.getPostsByCategory(category, page, size));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        String content = body.get("content").toString();
        Comment comment = contentService.addComment(postId, authorId, content);
        return ResponseEntity.ok(Map.of("id", comment.getId(), "content", comment.getContent(),
                "authorId", comment.getAuthorId(), "postId", comment.getPostId()));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(contentService.getCommentsByPost(postId));
    }

    @PostMapping("/{postId}/vote")
    public ResponseEntity<?> voteOnPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        VoteType voteType = VoteType.valueOf(body.get("voteType").toString());
        Post post = contentService.voteOnPost(postId, userId, voteType);
        return ResponseEntity.ok(Map.of("voteCount", post.getVoteCount()));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        String title = body.get("title").toString();
        String description = body.get("description").toString();
        PostCategory category = PostCategory.valueOf(body.get("category").toString());
        Post post = contentService.updatePost(postId, authorId, title, description, category);
        return ResponseEntity.ok(Map.of("id", post.getId(), "title", post.getTitle()));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        contentService.deletePost(postId, authorId);
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> body) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        String content = body.get("content").toString();
        Comment comment = contentService.updateComment(commentId, authorId, content);
        return ResponseEntity.ok(Map.of("id", comment.getId(), "content", comment.getContent()));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long commentId) {
        Long authorId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found")).getId();
        contentService.deleteComment(commentId, authorId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted"));
    }
}