package com.forumhub.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    public static final String NEW_FOLLOWER = "NEW_FOLLOWER";
    public static final String POST_REPLY = "POST_REPLY";
    public static final String COMMENT_REPLY = "COMMENT_REPLY";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    public User recipient;

    @ManyToOne
    @JoinColumn(name = "actor_id")
    public User actor;

    @Column(nullable = false)
    public String type;

    @Column(nullable = false, length = 500)
    public String message;

    /** Post the notification points at, or the actor for follow notifications. */
    @Column(name = "reference_id")
    public Long referenceId;

    @Column(name = "is_read", nullable = false)
    public boolean read;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public Notification() {}

    public Notification(User recipient, User actor, String type, String message, Long referenceId) {
        this.recipient = recipient;
        this.actor = actor;
        this.type = type;
        this.message = message;
        this.referenceId = referenceId;
    }
}
