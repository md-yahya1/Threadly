package com.forumhub.entity;

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

    @Column(nullable = false, unique = true)
    public String email;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    public String bio;

    @Column(name = "avatar_url")
    public String avatarUrl;

    public int karma;

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
}

