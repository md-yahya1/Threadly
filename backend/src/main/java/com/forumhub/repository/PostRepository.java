package com.forumhub.repository;

import com.forumhub.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByCommunityId(Long id, Pageable page);

    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable page);

    long countByAuthorId(Long authorId);
}
