# ForumHub

ForumHub is a Reddit-inspired discussion platform built with Spring Boot, MySQL, and React.

## Plan
1. Foundation: database migrations, security, authentication, validation, and error responses.
2. Discussion: communities, membership, posts, comments, votes, and saved posts.
3. Trust & safety: reports, moderation logs, and notifications.
4. Polish: React interface, search, tests, and deployment documentation.

## Proposed schema
`users` own `posts`, `comments`, votes, reports, and notifications. `communities` have a creator, members, rules, and posts. Comments use `parent_comment_id` for nesting. Unique `(user_id, post_id)` and `(user_id, comment_id)` constraints prevent duplicate votes.

## Run locally
1. Install the local tools listed in `requirements.txt`. On Windows, run `./setup-maven.ps1` to install Maven through winget.
2. Create MySQL database: `CREATE DATABASE forumhub;`
3. Copy `backend/.env.example` to `backend/.env` and adjust values if needed.
4. Run `mvn spring-boot:run` inside `backend` (requires Maven 3.9+ and Java 21+).
5. Run `npm.cmd install` then `npm.cmd run dev` inside `frontend`.

The backend starts on `http://localhost:8080`; the frontend starts on `http://localhost:5173`.
