package com.example.board.controller;

import com.example.board.dto.PostRequest;
import com.example.board.dto.PostResponse;
import com.example.board.model.Post;
import com.example.board.model.User;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts;
        
        if (search != null && !search.isEmpty()) {
            posts = postRepository.searchByKeyword(search, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }
        
        Page<PostResponse> response = posts.map(PostResponse::from);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(post -> {
                    post.setViewCount(post.getViewCount() + 1);
                    postRepository.save(post);
                    return ResponseEntity.ok(PostResponse.from(post));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPost(@Valid @RequestBody PostRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String username = authentication.getName();
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(author)
                .viewCount(0L)
                .build();

        Post savedPost = postRepository.save(post);
        return ResponseEntity.ok(PostResponse.from(savedPost));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @Valid @RequestBody PostRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String username = authentication.getName();
        
        return postRepository.findById(id)
                .map(post -> {
                    if (!post.getAuthor().getUsername().equals(username)) {
                        return ResponseEntity.status(403).body("Forbidden");
                    }
                    
                    post.setTitle(request.getTitle());
                    post.setContent(request.getContent());
                    Post updatedPost = postRepository.save(post);
                    return ResponseEntity.ok(PostResponse.from(updatedPost));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String username = authentication.getName();
        
        return postRepository.findById(id)
                .map(post -> {
                    if (!post.getAuthor().getUsername().equals(username)) {
                        return ResponseEntity.status(403).body("Forbidden");
                    }
                    
                    postRepository.delete(post);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

