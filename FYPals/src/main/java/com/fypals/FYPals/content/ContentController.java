package com.fypals.FYPals.content;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/content")
public class ContentController {

    @Autowired
    private ContentService contentService;

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestParam Long authorId,
                                        @RequestParam String title,
                                        @RequestParam String description,
                                        @RequestParam PostCategory category) {
        try {
            Post post = contentService.createPost(authorId, title, description, category);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", post);
            response.put("message", "Post created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size,
                                         @RequestParam(defaultValue = "date") String sortBy) {
        try {
            Page<Post> posts = contentService.getAllPosts(page, size, sortBy);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", posts.getContent());
            response.put("currentPage", posts.getNumber());
            response.put("totalItems", posts.getTotalElements());
            response.put("totalPages", posts.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/posts/category/{category}")
    public ResponseEntity<?> getPostsByCategory(@PathVariable PostCategory category,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        try {
            Page<Post> posts = contentService.getPostsByCategory(category, page, size);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", posts.getContent());
            response.put("currentPage", posts.getNumber());
            response.put("totalItems", posts.getTotalElements());
            response.put("totalPages", posts.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId) {
        try {
            Post post = contentService.getPost(postId);
            List<Comment> comments = contentService.getCommentsByPost(postId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("post", post);
            response.put("comments", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long postId,
                                        @RequestParam Long authorId,
                                        @RequestParam String content) {
        try {
            Comment comment = contentService.addComment(postId, authorId, content);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", comment);
            response.put("message", "Comment added successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        try {
            List<Comment> comments = contentService.getCommentsByPost(postId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/posts/{postId}/vote")
    public ResponseEntity<?> voteOnPost(@PathVariable Long postId,
                                        @RequestParam Long userId,
                                        @RequestParam VoteType voteType) {
        try {
            Post post = contentService.voteOnPost(postId, userId, voteType);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", post);
            response.put("message", "Vote recorded successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    // Update a post
    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(@PathVariable Long postId,
                                        @RequestParam Long authorId,
                                        @RequestParam String title,
                                        @RequestParam String description,
                                        @RequestParam PostCategory category) {
        try {
            Post post = contentService.updatePost(postId, authorId, title, description, category);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", post);
            response.put("message", "Post updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Delete a post
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId,
                                        @RequestParam Long authorId) {
        try {
            contentService.deletePost(postId, authorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Post deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Update a comment
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId,
                                           @RequestParam Long authorId,
                                           @RequestParam String content) {
        try {
            Comment comment = contentService.updateComment(commentId, authorId, content);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", comment);
            response.put("message", "Comment updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Delete a comment
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId,
                                           @RequestParam Long authorId) {
        try {
            contentService.deleteComment(commentId, authorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Comment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}