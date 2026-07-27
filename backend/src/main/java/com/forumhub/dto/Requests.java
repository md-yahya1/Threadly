package com.forumhub.dto;

import jakarta.validation.constraints.*;

public final class Requests {
    private Requests(){}

    public record Register(
        @NotBlank @Size(min=3, max=30) String username,
        @Email @NotBlank String email,
        @NotBlank @Size(min=8, max=100) String password
    ){}

    public record Login(
        @NotBlank String usernameOrEmail,
        @NotBlank String password
    ){}

    public record AuthResponse(
        String token,
        Long id,
        String username,
        String email,
        String message
    ){}

    public record CommunityCreate(
        @NotBlank @Size(max=50) String name,
        @NotBlank @Size(max=1000) String description,
        String visibility
    ){}

    public record PostCreate(
        @NotNull Long communityId,
        @NotBlank @Size(max=300) String title,
        String content,
        String postType,
        String externalUrl
    ){}

    public record CommentCreate(
        @NotBlank @Size(max=10000) String content,
        Long parentCommentId
    ){}

    public record VoteRequest(
        int value
    ){}
}
