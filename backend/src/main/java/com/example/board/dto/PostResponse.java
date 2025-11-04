package com.example.board.dto;

import com.example.board.model.Post;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostResponse {
    private Long id;
    private String title;
    private String content;
    private String authorUsername;
    private Long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static PostResponse from(Post post) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setTitle(post.getTitle());
        response.setContent(post.getContent());
        response.setAuthorUsername(post.getAuthor().getUsername());
        response.setViewCount(post.getViewCount());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        return response;
    }
}

