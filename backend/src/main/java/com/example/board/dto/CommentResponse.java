package com.example.board.dto;

import com.example.board.model.Comment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private String content;
    private String authorUsername;
    private Long postId;
    private Long parentId;
    private LocalDateTime createdAt;
    
    public static CommentResponse from(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setContent(comment.getContent());
        response.setAuthorUsername(comment.getAuthor().getUsername());
        response.setPostId(comment.getPost().getId());
        response.setParentId(comment.getParent() != null ? comment.getParent().getId() : null);
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }
}

