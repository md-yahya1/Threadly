package com.forumhub.controller;

import com.forumhub.config.JwtTokenProvider;
import com.forumhub.dto.Requests.*;
import com.forumhub.entity.*;
import com.forumhub.repository.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class ForumController {

    private final UserRepository users;
    private final RoleRepository roles;
    private final CommunityRepository communities;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final PostVoteRepository postVotes;
    private final FollowRepository follows;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider tokenProvider;

    public ForumController(
            UserRepository u,
            RoleRepository r,
            CommunityRepository c,
            PostRepository p,
            CommentRepository co,
            PostVoteRepository pv,
            FollowRepository f,
            PasswordEncoder e,
            JwtTokenProvider tp) {
        this.users = u;
        this.roles = r;
        this.communities = c;
        this.posts = p;
        this.comments = co;
        this.postVotes = pv;
        this.follows = f;
        this.encoder = e;
        this.tokenProvider = tp;
    }

    private User getCurrentUserOrNull(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            return null;
        }
        return (User) auth.getPrincipal();
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            throw new IllegalStateException("Authentication required for this operation");
        }
        return (User) auth.getPrincipal();
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody Register r) {
        if (users.existsByEmail(r.email()) || users.existsByUsername(r.username())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username or email already exists"));
        }
        User u = new User();
        u.username = r.username();
        u.email = r.email();
        u.passwordHash = encoder.encode(r.password());
        u.roles.add(roles.findByName("USER").orElseGet(() -> {
            Role newRole = new Role();
            newRole.name = "USER";
            return roles.save(newRole);
        }));
        users.save(u);

        String token = tokenProvider.generateToken(u.id, u.username);
        String refreshToken = tokenProvider.generateRefreshToken(u.id, u.username);
        return ResponseEntity.status(201).body(new AuthResponse(token, refreshToken, u.id, u.username, u.email, "Registration successful"));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody Login r) {
        Optional<User> uOpt = users.findByUsername(r.usernameOrEmail()).or(() -> users.findByEmail(r.usernameOrEmail()));
        if (uOpt.isEmpty() || !encoder.matches(r.password(), uOpt.get().passwordHash)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        User u = uOpt.get();
        String token = tokenProvider.generateToken(u.id, u.username);
        String refreshToken = tokenProvider.generateRefreshToken(u.id, u.username);
        return ResponseEntity.ok(new AuthResponse(token, refreshToken, u.id, u.username, u.email, "Login successful"));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest r) {
        if (!tokenProvider.validateRefreshToken(r.refreshToken())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired refresh token"));
        }
        String username = tokenProvider.getUsernameFromToken(r.refreshToken());
        User u = users.findByUsername(username).orElse(null);
        if (u == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired refresh token"));
        }
        String newAccessToken = tokenProvider.generateToken(u.id, u.username);
        String newRefreshToken = tokenProvider.generateRefreshToken(u.id, u.username);
        return ResponseEntity.ok(new AuthResponse(newAccessToken, newRefreshToken, u.id, u.username, u.email, "Token refreshed"));
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUserProfile(Authentication auth) {
        User u = getCurrentUser(auth);
        return ResponseEntity.ok(new UserProfileResponse(
                u.id, u.username, u.email, u.bio, u.avatarUrl, u.karma, u.createdAt.toString()));
    }

    @PutMapping("/users/me")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileRequest r, Authentication auth) {
        User u = getCurrentUser(auth);
        u.bio = r.bio();
        u.avatarUrl = r.avatarUrl();
        users.save(u);
        return ResponseEntity.ok(new UserProfileResponse(
                u.id, u.username, u.email, u.bio, u.avatarUrl, u.karma, u.createdAt.toString()));
    }

    @PutMapping("/users/me/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest r, Authentication auth) {
        User u = getCurrentUser(auth);
        if (!encoder.matches(r.currentPassword(), u.passwordHash)) {
            return ResponseEntity.status(400).body(Map.of("message", "Current password is incorrect"));
        }
        u.passwordHash = encoder.encode(r.newPassword());
        users.save(u);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<?> getPublicProfile(@PathVariable String username, Authentication auth) {
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        User me = getCurrentUserOrNull(auth);
        boolean isFollowing = me != null && follows.existsByIdFollowerIdAndIdFollowingId(me.id, target.id);
        return ResponseEntity.ok(new PublicProfileResponse(
                target.id, target.username, target.bio, target.avatarUrl, target.karma,
                follows.countByIdFollowingId(target.id), follows.countByIdFollowerId(target.id), isFollowing));
    }

    @PostMapping("/users/{username}/follow")
    public ResponseEntity<?> followUser(@PathVariable String username, Authentication auth) {
        User me = getCurrentUser(auth);
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        if (me.id.equals(target.id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "You can't follow yourself"));
        }
        if (!follows.existsByIdFollowerIdAndIdFollowingId(me.id, target.id)) {
            follows.save(new Follow(me, target));
        }
        return ResponseEntity.ok(new FollowActionResponse("Following", follows.countByIdFollowingId(target.id)));
    }

    @DeleteMapping("/users/{username}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable String username, Authentication auth) {
        User me = getCurrentUser(auth);
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        follows.deleteByIdFollowerIdAndIdFollowingId(me.id, target.id);
        return ResponseEntity.ok(new FollowActionResponse("Unfollowed", follows.countByIdFollowingId(target.id)));
    }

    @GetMapping("/users/{username}/followers")
    public Page<UserSummary> getFollowers(@PathVariable String username,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        return follows.findByIdFollowingId(target.id, PageRequest.of(page, Math.min(size, 50)))
                .map(f -> new UserSummary(f.follower.id, f.follower.username, f.follower.avatarUrl));
    }

    @GetMapping("/users/{username}/following")
    public Page<UserSummary> getFollowing(@PathVariable String username,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        return follows.findByIdFollowerId(target.id, PageRequest.of(page, Math.min(size, 50)))
                .map(f -> new UserSummary(f.following.id, f.following.username, f.following.avatarUrl));
    }

    @GetMapping("/communities")
    public List<Community> listCommunities() {
        return communities.findAll();
    }

    @PostMapping("/communities")
    public ResponseEntity<?> createCommunity(@Valid @RequestBody CommunityCreate r, Authentication auth) {
        if (communities.findByName(r.name()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Community name taken"));
        }
        User creator = getCurrentUser(auth);
        Community c = new Community();
        c.name = r.name();
        c.description = r.description();
        c.creator = creator;
        if (r.visibility() != null) {
            c.visibility = r.visibility();
        }
        return ResponseEntity.status(201).body(communities.save(c));
    }

    @GetMapping("/posts")
    public Page<Post> listPosts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return posts.findAll(PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@Valid @RequestBody PostCreate r, Authentication auth) {
        Community c = null;
        if (r.communityId() != null) {
            c = communities.findById(r.communityId()).orElseThrow(() -> new NoSuchElementException("Community not found"));
        }
        User author = getCurrentUser(auth);

        Post p = new Post();
        p.community = c;
        p.author = author;
        p.title = r.title();
        p.content = r.content();
        p.postType = r.postType() == null ? "TEXT" : r.postType();
        p.externalUrl = r.externalUrl();
        return ResponseEntity.status(201).body(posts.save(p));
    }

    @PostMapping("/posts/{id}/vote")
    public ResponseEntity<?> votePost(@PathVariable Long id, @RequestBody VoteRequest r, Authentication auth) {
        User user = getCurrentUser(auth);
        Post post = posts.findById(id).orElseThrow(() -> new NoSuchElementException("Post not found"));

        int targetValue = Integer.compare(r.value(), 0); // Clamp to -1, 0, or 1
        Optional<PostVote> existingOpt = postVotes.findByIdUserIdAndIdPostId(user.id, post.id);

        int oldValue = existingOpt.map(v -> Integer.valueOf(v.value)).orElse(0);
        int diff = targetValue - oldValue;

        if (diff != 0) {
            post.score += diff;
            posts.save(post);

            if (targetValue == 0) {
                existingOpt.ifPresent(postVotes::delete);
            } else {
                PostVote vote = existingOpt.orElseGet(() -> new PostVote(user.id, post.id, targetValue));
                vote.value = (byte) targetValue;
                postVotes.save(vote);
            }
        }

        return ResponseEntity.ok(Map.of("postId", post.id, "score", post.score, "userVote", targetValue));
    }

    @GetMapping("/posts/{id}/comments")
    public List<Comment> listComments(@PathVariable Long id) {
        return comments.findByPostIdOrderByCreatedAtAsc(id);
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @Valid @RequestBody CommentCreate r, Authentication auth) {
        Post p = posts.findById(id).orElseThrow(() -> new NoSuchElementException("Post not found"));
        User author = getCurrentUser(auth);

        Comment c = new Comment();
        c.post = p;
        c.author = author;
        c.content = r.content();
        if (r.parentCommentId() != null) {
            c.parent = comments.findById(r.parentCommentId()).orElseThrow(() -> new NoSuchElementException("Parent comment not found"));
        }

        p.commentCount++;
        posts.save(p);
        return ResponseEntity.status(201).body(comments.save(c));
    }
}
