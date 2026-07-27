package com.forumhub.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "post_votes")
public class PostVote {

    @EmbeddedId
    public PostVoteId id = new PostVoteId();

    @Column(nullable = false)
    public byte value;

    public PostVote() {}

    public PostVote(Long userId, Long postId, byte value) {
        this.id = new PostVoteId(userId, postId);
        this.value = value;
    }

    public PostVote(Long userId, Long postId, int value) {
        this.id = new PostVoteId(userId, postId);
        this.value = (byte) value;
    }

    @Embeddable
    public static class PostVoteId implements Serializable {
        @Column(name = "user_id")
        public Long userId;

        @Column(name = "post_id")
        public Long postId;

        public PostVoteId() {}

        public PostVoteId(Long userId, Long postId) {
            this.userId = userId;
            this.postId = postId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PostVoteId that = (PostVoteId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(postId, that.postId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, postId);
        }
    }
}
