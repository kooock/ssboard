package com.example.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostRequest {
    @NotBlank
    @Size(max = 200)
    private String title;
    
    @NotBlank
    private String content;
}

