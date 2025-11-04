package com.example.board.config;

import com.example.board.model.Comment;
import com.example.board.model.Post;
import com.example.board.model.User;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create demo users if they don't exist
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);

            User user1 = User.builder()
                    .username("user1")
                    .email("user1@example.com")
                    .password(passwordEncoder.encode("user123"))
                    .role(User.Role.USER)
                    .build();
            userRepository.save(user1);

            User user2 = User.builder()
                    .username("user2")
                    .email("user2@example.com")
                    .password(passwordEncoder.encode("user123"))
                    .role(User.Role.USER)
                    .build();
            userRepository.save(user2);

            // Create demo posts
            Post post1 = Post.builder()
                    .title("Docker와 Kubernetes 시작하기")
                    .content("Docker와 Kubernetes를 배우기 위한 첫 번째 게시글입니다. 컨테이너화는 현대 애플리케이션 개발에서 필수적인 기술입니다.")
                    .author(admin)
                    .viewCount(10L)
                    .build();
            postRepository.save(post1);

            Post post2 = Post.builder()
                    .title("Spring Boot 게시판 만들기")
                    .content("Spring Boot로 간단한 게시판을 만들어봅시다. JPA, Spring Security, JWT를 활용합니다.")
                    .author(user1)
                    .viewCount(5L)
                    .build();
            postRepository.save(post2);

            Post post3 = Post.builder()
                    .title("Next.js로 프론트엔드 개발하기")
                    .content("React 기반의 Next.js 프레임워크를 사용하여 현대적인 웹 애플리케이션을 만들어봅시다.")
                    .author(user2)
                    .viewCount(8L)
                    .build();
            postRepository.save(post3);

            // Create demo comments
            Comment comment1 = Comment.builder()
                    .content("좋은 글 감사합니다!")
                    .author(user1)
                    .post(post1)
                    .build();
            commentRepository.save(comment1);

            Comment comment2 = Comment.builder()
                    .content("Docker를 처음 배우는데 도움이 많이 되었습니다.")
                    .author(user2)
                    .post(post1)
                    .build();
            commentRepository.save(comment2);

            Comment reply1 = Comment.builder()
                    .content("도움이 되셨다니 기쁩니다!")
                    .author(admin)
                    .post(post1)
                    .parent(comment2)
                    .build();
            commentRepository.save(reply1);

            System.out.println("===================================");
            System.out.println("Demo data loaded successfully!");
            System.out.println("Admin: admin / admin123");
            System.out.println("User1: user1 / user123");
            System.out.println("User2: user2 / user123");
            System.out.println("===================================");
        }
    }
}

