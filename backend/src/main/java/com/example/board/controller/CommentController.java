package com.example.board.controller;

import com.example.board.dto.CommentRequest;
import com.example.board.dto.CommentResponse;
import com.example.board.model.Comment;
import com.example.board.model.Post;
import com.example.board.model.User;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsByPostId(@PathVariable Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        List<CommentResponse> response = comments.stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String username = authentication.getName();
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .author(author)
                .post(post)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParent(parent);
        }

        Comment savedComment = commentRepository.save(comment);
        return ResponseEntity.ok(CommentResponse.from(savedComment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String username = authentication.getName();
        
        return commentRepository.findById(commentId)
                .map(comment -> {
                    if (!comment.getAuthor().getUsername().equals(username)) {
                        return ResponseEntity.status(403).body("Forbidden");
                    }
                    
                    commentRepository.delete(comment);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

