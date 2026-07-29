package com.forumhub.dto;

import jakarta.validation.constraints.*;

public final class Requests {

    private Requests() {}

    public record Register(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
        String password
    ) {}

    public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
        String password
    ) {}

    public record SignupRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
        String password
    ) {}

    public record Login(
        @NotBlank(message = "Username or email is required")
        String usernameOrEmail,

        @NotBlank(message = "Password is required")
        String password
    ) {}

    public record AuthResponse(
        String token,
        String refreshToken,
        Long id,
        String username,
        String email,
        String message
    ) {}

    public record RefreshRequest(
        @NotBlank(message = "Refresh token is required")
        String refreshToken
    ) {}

    public record CommunityCreate(
        @NotBlank(message = "Community name is required")
        @Size(max = 50, message = "Community name cannot exceed 50 characters")
        String name,

        @NotBlank(message = "Description is required")
        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description,

        String visibility
    ) {}

    public record PostCreate(
        Long communityId,

        @NotBlank(message = "Title is required")
        @Size(max = 300, message = "Title cannot exceed 300 characters")
        String title,

        String content,
        String postType,
        String externalUrl
    ) {}

    public record CommentCreate(
        @NotBlank(message = "Comment content cannot be blank")
        @Size(max = 10000, message = "Comment content cannot exceed 10000 characters")
        String content,

        Long parentCommentId
    ) {}

    public record VoteRequest(
        int value
    ) {}

    public record UpdateProfileRequest(
        @Size(max = 300, message = "Bio cannot exceed 300 characters")
        String bio,

        @Size(max = 500, message = "Avatar URL cannot exceed 500 characters")
        String avatarUrl
    ) {}

    public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 100, message = "New password must be at least 8 characters long")
        String newPassword
    ) {}

    public record UserProfileResponse(
        Long id,
        String username,
        String email,
        String bio,
        String avatarUrl,
        int karma,
        String createdAt
    ) {}

    public record PublicProfileResponse(
        Long id,
        String username,
        String bio,
        String avatarUrl,
        int karma,
        long followerCount,
        long followingCount,
        boolean isFollowing
    ) {}

    public record UserSummary(
        Long id,
        String username,
        String avatarUrl
    ) {}

    public record FollowActionResponse(
        String message,
        long followerCount
    ) {}
}

