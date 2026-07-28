package com.forumhub.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne
    @JoinColumn(name = "post_id")
    public Post post;

    @ManyToOne
    @JoinColumn(name = "parent_comment_id")
    public Comment parent;

    @ManyToOne
    @JoinColumn(name = "author_id")
    public User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    public String content;

    public int score;

    public String status = "ACTIVE";

    public boolean locked;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
}

