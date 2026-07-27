# ForumHub Requirements

## Functional requirements
- Register, log in, log out, refresh JWT tokens; BCrypt password storage.
- Roles: USER, MODERATOR, ADMIN.
- User profiles: username, bio, avatar, karma, join date.
- Communities: create, browse, join/leave, rules, visibility, moderators.
- Posts: text/link/image, edit/delete/save, vote, pagination, Home/Latest/Popular/community feeds, Hot/New/Top/Controversial sorting.
- Comments: nested replies, edit/delete, vote, moderator remove/lock actions.
- Safety: report post/comment/user; report queue; dismiss/remove/warn/ban/suspend; audit logs.
- Notifications: replies, mentions, moderation events, invitations, read/unread status.

## Technical requirements
- Java 21+, Spring Boot, Maven, MySQL 8, React, REST APIs.
- Spring Security, JWT access and refresh tokens, Spring Data JPA/Hibernate.
- Flyway migrations, DTOs, validation, centralized API errors, pagination, indexes, and unique vote constraints.
- Unit tests for services and controller tests for primary endpoints.
- Development seed data and a clear README.

## Local prerequisites
- Java 21 or later
- Maven 3.9 or later (`mvn --version`)
- MySQL 8
- Node.js 20+ and npm for the frontend
