package com.forumhub.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "comment_votes")
public class CommentVote {

    @EmbeddedId
    public CommentVoteId id = new CommentVoteId();

    @Column(nullable = false)
    public byte value;

    public CommentVote() {}

    public CommentVote(Long userId, Long commentId, int value) {
        this.id = new CommentVoteId(userId, commentId);
        this.value = (byte) value;
    }

    @Embeddable
    public static class CommentVoteId implements Serializable {
        @Column(name = "user_id")
        public Long userId;

        @Column(name = "comment_id")
        public Long commentId;

        public CommentVoteId() {}

        public CommentVoteId(Long userId, Long commentId) {
            this.userId = userId;
            this.commentId = commentId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            CommentVoteId that = (CommentVoteId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(commentId, that.commentId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, commentId);
        }
    }
}
