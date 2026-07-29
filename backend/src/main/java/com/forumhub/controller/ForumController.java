package com.forumhub.controller;

import com.forumhub.config.JwtTokenProvider;
import com.forumhub.dto.Requests.*;
import com.forumhub.entity.*;
import com.forumhub.repository.*;
import com.forumhub.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ForumController {

    private final UserRepository users;
    private final RoleRepository roles;
    private final CommunityRepository communities;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final PostVoteRepository postVotes;
    private final CommentVoteRepository commentVotes;
    private final FollowRepository follows;
    private final SavedPostRepository savedPosts;
    private final SavedCommentRepository savedComments;
    private final NotificationRepository notifications;
    private final NotificationService notifier;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider tokenProvider;

    public ForumController(
            UserRepository u,
            RoleRepository r,
            CommunityRepository c,
            PostRepository p,
            CommentRepository co,
            PostVoteRepository pv,
            CommentVoteRepository cv,
            FollowRepository f,
            SavedPostRepository sp,
            SavedCommentRepository sc,
            NotificationRepository n,
            NotificationService ns,
            PasswordEncoder e,
            JwtTokenProvider tp) {
        this.users = u;
        this.roles = r;
        this.communities = c;
        this.posts = p;
        this.comments = co;
        this.postVotes = pv;
        this.commentVotes = cv;
        this.follows = f;
        this.savedPosts = sp;
        this.savedComments = sc;
        this.notifications = n;
        this.notifier = ns;
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
        return ResponseEntity.ok(toProfileResponse(u));
    }

    @PutMapping("/users/me")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileRequest r, Authentication auth) {
        User u = getCurrentUser(auth);
        u.bio = r.bio();
        u.avatarUrl = r.avatarUrl();
        users.save(u);
        return ResponseEntity.ok(toProfileResponse(u));
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
                target.id, target.username, target.bio, target.avatarUrl,
                target.totalKarma(), target.postKarma, target.commentKarma,
                posts.countByAuthorId(target.id), comments.countByAuthorId(target.id),
                follows.countByIdFollowingId(target.id), follows.countByIdFollowerId(target.id),
                isFollowing, target.createdAt.toString()));
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
            notifier.newFollower(me, target);
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

    @GetMapping("/users/{username}/posts")
    public Page<Post> getUserPosts(@PathVariable String username,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        return posts.findByAuthorIdOrderByCreatedAtDesc(target.id, PageRequest.of(page, Math.min(size, 50)));
    }

    @GetMapping("/users/{username}/comments")
    public Page<CommentResponse> getUserComments(@PathVariable String username,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size,
                                                 Authentication auth) {
        User target = users.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User not found"));
        Page<Comment> found = comments.findByAuthorIdOrderByCreatedAtDesc(target.id, PageRequest.of(page, Math.min(size, 50)));
        return toCommentPage(found, getCurrentUserOrNull(auth));
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

            awardKarma(post.author, user, diff, true);
        }

        return ResponseEntity.ok(new VoteResponse(post.id, post.score, targetValue));
    }

    @PostMapping("/comments/{id}/vote")
    public ResponseEntity<?> voteComment(@PathVariable Long id, @RequestBody VoteRequest r, Authentication auth) {
        User user = getCurrentUser(auth);
        Comment comment = comments.findById(id).orElseThrow(() -> new NoSuchElementException("Comment not found"));

        int targetValue = Integer.compare(r.value(), 0);
        Optional<CommentVote> existingOpt = commentVotes.findByIdUserIdAndIdCommentId(user.id, comment.id);

        int oldValue = existingOpt.map(v -> Integer.valueOf(v.value)).orElse(0);
        int diff = targetValue - oldValue;

        if (diff != 0) {
            comment.score += diff;
            comments.save(comment);

            if (targetValue == 0) {
                existingOpt.ifPresent(commentVotes::delete);
            } else {
                CommentVote vote = existingOpt.orElseGet(() -> new CommentVote(user.id, comment.id, targetValue));
                vote.value = (byte) targetValue;
                commentVotes.save(vote);
            }

            awardKarma(comment.author, user, diff, false);
        }

        return ResponseEntity.ok(new VoteResponse(comment.id, comment.score, targetValue));
    }

    @PostMapping("/posts/{id}/save")
    public ResponseEntity<?> savePost(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        Post post = posts.findById(id).orElseThrow(() -> new NoSuchElementException("Post not found"));
        if (!savedPosts.existsByIdUserIdAndIdPostId(me.id, post.id)) {
            savedPosts.save(new SavedPost(me, post));
        }
        return ResponseEntity.ok(new SaveActionResponse("Post saved", true));
    }

    @DeleteMapping("/posts/{id}/save")
    public ResponseEntity<?> unsavePost(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        savedPosts.deleteByIdUserIdAndIdPostId(me.id, id);
        return ResponseEntity.ok(new SaveActionResponse("Post removed from saved", false));
    }

    @PostMapping("/comments/{id}/save")
    public ResponseEntity<?> saveComment(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        Comment comment = comments.findById(id).orElseThrow(() -> new NoSuchElementException("Comment not found"));
        if (!savedComments.existsByIdUserIdAndIdCommentId(me.id, comment.id)) {
            savedComments.save(new SavedComment(me, comment));
        }
        return ResponseEntity.ok(new SaveActionResponse("Comment saved", true));
    }

    @DeleteMapping("/comments/{id}/save")
    public ResponseEntity<?> unsaveComment(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        savedComments.deleteByIdUserIdAndIdCommentId(me.id, id);
        return ResponseEntity.ok(new SaveActionResponse("Comment removed from saved", false));
    }

    @GetMapping("/users/me/saved/posts")
    public Page<Post> listSavedPosts(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size,
                                     Authentication auth) {
        User me = getCurrentUser(auth);
        return savedPosts.findByIdUserIdOrderByCreatedAtDesc(me.id, PageRequest.of(page, Math.min(size, 50)))
                .map(s -> s.post);
    }

    @GetMapping("/users/me/saved/post-ids")
    public List<Long> listSavedPostIds(Authentication auth) {
        User me = getCurrentUser(auth);
        return savedPosts.findByIdUserIdOrderByCreatedAtDesc(me.id, Pageable.unpaged())
                .map(s -> s.id.postId)
                .getContent();
    }

    @GetMapping("/users/me/saved/comments")
    public Page<CommentResponse> listSavedComments(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size,
                                                   Authentication auth) {
        User me = getCurrentUser(auth);
        Page<Comment> found = savedComments
                .findByIdUserIdOrderByCreatedAtDesc(me.id, PageRequest.of(page, Math.min(size, 50)))
                .map(s -> s.comment);
        return toCommentPage(found, me);
    }

    @GetMapping("/notifications")
    public Page<NotificationResponse> listNotifications(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size,
                                                        Authentication auth) {
        User me = getCurrentUser(auth);
        return notifications.findByRecipientIdOrderByCreatedAtDesc(me.id, PageRequest.of(page, Math.min(size, 50)))
                .map(n -> new NotificationResponse(
                        n.id, n.type, n.message, n.referenceId, n.read, n.createdAt.toString(),
                        n.actor == null ? null : new UserSummary(n.actor.id, n.actor.username, n.actor.avatarUrl)));
    }

    @GetMapping("/notifications/unread-count")
    public UnreadCountResponse countUnreadNotifications(Authentication auth) {
        User me = getCurrentUser(auth);
        return new UnreadCountResponse(notifications.countByRecipientIdAndReadFalse(me.id));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        Notification n = notifications.findById(id)
                .filter(found -> found.recipient.id.equals(me.id))
                .orElseThrow(() -> new NoSuchElementException("Notification not found"));
        n.read = true;
        notifications.save(n);
        return ResponseEntity.ok(new UnreadCountResponse(notifications.countByRecipientIdAndReadFalse(me.id)));
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead(Authentication auth) {
        User me = getCurrentUser(auth);
        notifications.markAllReadForUser(me.id);
        return ResponseEntity.ok(new UnreadCountResponse(0));
    }

    @GetMapping("/posts/{id}/comments")
    public List<CommentResponse> listComments(@PathVariable Long id, Authentication auth) {
        return toCommentResponses(comments.findByPostIdOrderByCreatedAtAsc(id), getCurrentUserOrNull(auth));
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
        comments.save(c);

        if (c.parent != null) {
            notifier.commentReply(author, c.parent, c);
        } else {
            notifier.postReply(author, p, c);
        }

        return ResponseEntity.status(201).body(toCommentResponses(List.of(c), author).get(0));
    }

    private UserProfileResponse toProfileResponse(User u) {
        return new UserProfileResponse(u.id, u.username, u.email, u.bio, u.avatarUrl,
                u.totalKarma(), u.postKarma, u.commentKarma, u.createdAt.toString());
    }

    /** Votes on your own content are free, so they never move karma. */
    private void awardKarma(User author, User voter, int diff, boolean forPost) {
        if (author == null || author.id.equals(voter.id)) {
            return;
        }
        if (forPost) {
            author.postKarma += diff;
        } else {
            author.commentKarma += diff;
        }
        users.save(author);
    }

    private Page<CommentResponse> toCommentPage(Page<Comment> page, User me) {
        return new PageImpl<>(toCommentResponses(page.getContent(), me), page.getPageable(), page.getTotalElements());
    }

    private List<CommentResponse> toCommentResponses(List<Comment> found, User me) {
        if (found.isEmpty()) {
            return List.of();
        }

        Map<Long, Integer> votes = Map.of();
        Set<Long> saved = Set.of();
        if (me != null) {
            List<Long> ids = found.stream().map(c -> c.id).toList();
            votes = commentVotes.findByIdUserIdAndIdCommentIdIn(me.id, ids).stream()
                    .collect(Collectors.toMap(v -> v.id.commentId, v -> (int) v.value));
            saved = savedComments.findByIdUserIdAndIdCommentIdIn(me.id, ids).stream()
                    .map(s -> s.id.commentId)
                    .collect(Collectors.toSet());
        }

        Map<Long, Integer> myVotes = votes;
        Set<Long> mySaved = saved;
        return found.stream()
                .map(c -> new CommentResponse(
                        c.id,
                        c.post == null ? null : c.post.id,
                        c.post == null ? null : c.post.title,
                        c.parent == null ? null : c.parent.id,
                        c.content,
                        c.score,
                        myVotes.getOrDefault(c.id, 0),
                        mySaved.contains(c.id),
                        c.createdAt.toString(),
                        c.author == null ? null : new UserSummary(c.author.id, c.author.username, c.author.avatarUrl)))
                .toList();
    }
}
