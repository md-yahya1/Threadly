package com.forumhub.repository;

import com.forumhub.entity.CommentVote;
import com.forumhub.entity.CommentVote.CommentVoteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentVoteRepository extends JpaRepository<CommentVote, CommentVoteId> {
    Optional<CommentVote> findByIdUserIdAndIdCommentId(Long userId, Long commentId);

    List<CommentVote> findByIdUserIdAndIdCommentIdIn(Long userId, Collection<Long> commentIds);
}
