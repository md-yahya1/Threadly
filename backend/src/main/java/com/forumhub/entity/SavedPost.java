package com.forumhub.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "saved_posts")
public class SavedPost {

    @EmbeddedId
    public SavedPostId id = new SavedPostId();

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    public User user;

    @ManyToOne
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    public Post post;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public SavedPost() {}

    public SavedPost(User user, Post post) {
        this.user = user;
        this.post = post;
        this.id = new SavedPostId(user.id, post.id);
    }

    @Embeddable
    public static class SavedPostId implements Serializable {
        @Column(name = "user_id")
        public Long userId;

        @Column(name = "post_id")
        public Long postId;

        public SavedPostId() {}

        public SavedPostId(Long userId, Long postId) {
            this.userId = userId;
            this.postId = postId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            SavedPostId that = (SavedPostId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(postId, that.postId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, postId);
        }
    }
}
