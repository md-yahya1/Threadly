package com.forumhub.repository;

import com.forumhub.entity.Follow;
import com.forumhub.entity.Follow.FollowId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, FollowId> {
    boolean existsByIdFollowerIdAndIdFollowingId(Long followerId, Long followingId);
    void deleteByIdFollowerIdAndIdFollowingId(Long followerId, Long followingId);
    long countByIdFollowingId(Long userId);   // followers of this user
    long countByIdFollowerId(Long userId);    // users this user follows
    Page<Follow> findByIdFollowingId(Long userId, Pageable pageable); // followers list
    Page<Follow> findByIdFollowerId(Long userId, Pageable pageable);  // following list
}
