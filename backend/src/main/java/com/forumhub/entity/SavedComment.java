package com.forumhub.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "saved_comments")
public class SavedComment {

    @EmbeddedId
    public SavedCommentId id = new SavedCommentId();

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    public User user;

    @ManyToOne
    @MapsId("commentId")
    @JoinColumn(name = "comment_id")
    public Comment comment;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public SavedComment() {}

    public SavedComment(User user, Comment comment) {
        this.user = user;
        this.comment = comment;
        this.id = new SavedCommentId(user.id, comment.id);
    }

    @Embeddable
    public static class SavedCommentId implements Serializable {
        @Column(name = "user_id")
        public Long userId;

        @Column(name = "comment_id")
        public Long commentId;

        public SavedCommentId() {}

        public SavedCommentId(Long userId, Long commentId) {
            this.userId = userId;
            this.commentId = commentId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            SavedCommentId that = (SavedCommentId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(commentId, that.commentId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, commentId);
        }
    }
}
