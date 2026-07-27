package com.forumhub.repository;

import com.forumhub.entity.*;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;

public final class Repositories {

    private Repositories() {
    }

    public interface Users extends JpaRepository<User, Long> {
        Optional<User> findByEmail(String email);

        Optional<User> findByUsername(String username);

        boolean existsByEmail(String email);

        boolean existsByUsername(String username);
    }

    public interface Roles extends JpaRepository<Role, Long> {
        Optional<Role> findByName(String name);
    }

    public interface Communities extends JpaRepository<Community, Long> {
        Optional<Community> findByName(String name);
    }

    public interface Posts extends JpaRepository<Post, Long> {
        Page<Post> findByCommunityId(Long id, Pageable page);
    }

    public interface Comments extends JpaRepository<Comment, Long> {
        List<Comment> findByPostIdOrderByCreatedAtAsc(Long id);
    }
}