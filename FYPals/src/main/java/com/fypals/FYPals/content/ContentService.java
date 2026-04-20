package com.fypals.FYPals.content;

import com.fypals.FYPals.notification.Notification;
import com.fypals.FYPals.notification.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ContentService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Post createPost(Long authorId, String title, String description, PostCategory category) {
        Post post = new Post(authorId, title, description, category);
        return postRepository.save(post);
    }

    public Page<Post> getAllPosts(int page, int size, String sortBy) {
        Pageable pageable;
        if ("votes".equals(sortBy)) {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "voteCount"));
        } else {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return postRepository.findAll(pageable);
    }

    public Page<Post> getPostsByCategory(PostCategory category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository.findByCategory(category, pageable);
    }

    public Post getPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Transactional
    public Comment addComment(Long postId, Long authorId, String content) {
        Post post = getPost(postId);

        Comment comment = new Comment(postId, authorId, content);
        Comment savedComment = commentRepository.save(comment);

        post.setCommentCount(commentRepository.countByPostId(postId));
        postRepository.save(post);

        if (!post.getAuthorId().equals(authorId)) {
            Notification notification = new Notification(
                    post.getAuthorId(),
                    "Someone commented on your post: " + post.getTitle(),
                    "COMMENT",
                    postId
            );
            notificationRepository.save(notification);
        }

        return savedComment;
    }

    public List<Comment> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    @Transactional
    public Post voteOnPost(Long postId, Long userId, VoteType voteType) {
        Post post = getPost(postId);

        java.util.Optional<Vote> existingVote = voteRepository.findByPostIdAndUserId(postId, userId);

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();

            if (vote.getVoteType() == voteType) {
                voteRepository.delete(vote);
                if (voteType == VoteType.UPVOTE) {
                    post.setVoteCount(post.getVoteCount() - 1);
                } else {
                    post.setVoteCount(post.getVoteCount() + 1);
                }
            } else {
                vote.setVoteType(voteType);
                voteRepository.save(vote);
                if (voteType == VoteType.UPVOTE) {
                    post.setVoteCount(post.getVoteCount() + 2);
                } else {
                    post.setVoteCount(post.getVoteCount() - 2);
                }
            }
        } else {
            Vote newVote = new Vote(postId, userId, voteType);
            voteRepository.save(newVote);
            if (voteType == VoteType.UPVOTE) {
                post.setVoteCount(post.getVoteCount() + 1);
            } else {
                post.setVoteCount(post.getVoteCount() - 1);
            }
        }

        return postRepository.save(post);
    }

    public int getUpvoteCount(Long postId) {
        return voteRepository.countByPostIdAndVoteType(postId, VoteType.UPVOTE);
    }

    public int getDownvoteCount(Long postId) {
        return voteRepository.countByPostIdAndVoteType(postId, VoteType.DOWNVOTE);
    }
    // Update a post
    @Transactional
    public Post updatePost(Long postId, Long authorId, String title, String description, PostCategory category) {
        Post post = getPost(postId);

        if (!post.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Only the author can update this post");
        }

        post.setTitle(title);
        post.setDescription(description);
        post.setCategory(category);
        return postRepository.save(post);
    }

    // Delete a post (and all its comments and votes)
    @Transactional
    public void deletePost(Long postId, Long authorId) {
        Post post = getPost(postId);

        if (!post.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Only the author can delete this post");
        }

        // Delete all votes on this post
        voteRepository.deleteByPostId(postId);

        // Delete all comments on this post
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        commentRepository.deleteAll(comments);

        // Delete the post
        postRepository.delete(post);
    }

    // Update a comment
    @Transactional
    public Comment updateComment(Long commentId, Long authorId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Only the author can update this comment");
        }

        comment.setContent(content);
        Comment updatedComment = commentRepository.save(comment);

        return updatedComment;
    }

    // Delete a comment
    @Transactional
    public void deleteComment(Long commentId, Long authorId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Only the author can delete this comment");
        }

        Long postId = comment.getPostId();
        commentRepository.delete(comment);

        // Update comment count on the post
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setCommentCount(commentRepository.countByPostId(postId));
        postRepository.save(post);
    }
}