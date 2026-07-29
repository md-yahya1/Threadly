package com.forumhub.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "follows")
public class Follow {

    @EmbeddedId
    public FollowId id = new FollowId();

    @ManyToOne
    @MapsId("followerId")
    @JoinColumn(name = "follower_id")
    public User follower;

    @ManyToOne
    @MapsId("followingId")
    @JoinColumn(name = "following_id")
    public User following;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public Follow() {}

    public Follow(User follower, User following) {
        this.follower = follower;
        this.following = following;
        this.id = new FollowId(follower.id, following.id);
    }

    @Embeddable
    public static class FollowId implements Serializable {
        @Column(name = "follower_id")
        public Long followerId;

        @Column(name = "following_id")
        public Long followingId;

        public FollowId() {}

        public FollowId(Long followerId, Long followingId) {
            this.followerId = followerId;
            this.followingId = followingId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            FollowId that = (FollowId) o;
            return Objects.equals(followerId, that.followerId) && Objects.equals(followingId, that.followingId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(followerId, followingId);
        }
    }
}
