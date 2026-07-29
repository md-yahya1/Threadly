package com.forumhub.repository;

import com.forumhub.entity.SavedComment;
import com.forumhub.entity.SavedComment.SavedCommentId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

public interface SavedCommentRepository extends JpaRepository<SavedComment, SavedCommentId> {
    boolean existsByIdUserIdAndIdCommentId(Long userId, Long commentId);

    @Transactional
    void deleteByIdUserIdAndIdCommentId(Long userId, Long commentId);

    Page<SavedComment> findByIdUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<SavedComment> findByIdUserIdAndIdCommentIdIn(Long userId, Collection<Long> commentIds);
}
