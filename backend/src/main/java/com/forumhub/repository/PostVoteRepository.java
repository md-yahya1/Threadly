package com.forumhub.repository;

import com.forumhub.entity.PostVote;
import com.forumhub.entity.PostVote.PostVoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostVoteRepository extends JpaRepository<PostVote, PostVoteId> {
    Optional<PostVote> findByIdUserIdAndIdPostId(Long userId, Long postId);
}
