package com.forumhub.repository;

import com.forumhub.entity.SavedPost;
import com.forumhub.entity.SavedPost.SavedPostId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {
    boolean existsByIdUserIdAndIdPostId(Long userId, Long postId);

    @Transactional
    void deleteByIdUserIdAndIdPostId(Long userId, Long postId);

    Page<SavedPost> findByIdUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<SavedPost> findByIdUserIdAndIdPostIdIn(Long userId, Collection<Long> postIds);
}
