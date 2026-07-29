package com.forumhub.repository;

import com.forumhub.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long id);

    Page<Comment> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    long countByAuthorId(Long authorId);
}
