package com.forumhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String username;

    @JsonIgnore
    @Column(nullable = false, unique = true)
    public String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    public String bio;

    @Column(name = "avatar_url")
    public String avatarUrl;

    @Column(name = "post_karma", nullable = false)
    public int postKarma;

    @Column(name = "comment_karma", nullable = false)
    public int commentKarma;

    public String status = "ACTIVE";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    public Set<Role> roles = new HashSet<>();

    public int totalKarma() {
        return postKarma + commentKarma;
    }
}

