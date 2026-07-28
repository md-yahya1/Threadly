package com.forumhub.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "communities")
public class Community {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String name;

    @Column(nullable = false, length = 1000)
    public String description;

    public String visibility = "PUBLIC";

    @Column(name = "icon_url")
    public String iconUrl;

    @Column(name = "banner_url")
    public String bannerUrl;

    @ManyToOne
    @JoinColumn(name = "created_by")
    public User creator;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
}

