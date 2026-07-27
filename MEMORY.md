# ForumHub Project Memory

## Purpose
ForumHub is a Reddit-like full-stack discussion forum for communities, posts, nested comments, voting, moderation, and user management.

## Tech Stack
- **Backend**: Java 21+, Spring Boot 3.5.0, Spring Security (Stateless JWT), Spring Data JPA, Flyway DB Migrations, MySQL 8, Maven.
- **Frontend**: React 18, Vite, Vanilla CSS.

## Architecture & Production Components

### 1. Security & Authentication Layer (Stateless JWT)
- **JwtTokenProvider (`com.forumhub.config.JwtTokenProvider`)**: Generates and validates HMAC-SHA signed JWT access tokens using `io.jsonwebtoken` version 0.12.6.
- **JwtAuthenticationFilter (`com.forumhub.config.JwtAuthenticationFilter`)**: Intercepts requests, extracts `Authorization: Bearer <token>`, validates signature & expiry, populates Spring `SecurityContextHolder`.
- **SecurityConfig (`com.forumhub.config.SecurityConfig`)**: Configures `BCryptPasswordEncoder` bean and route security:
  - `PERMIT ALL`: `GET /api/health`, `POST /api/auth/**`, `GET /api/posts/**`, `GET /api/communities/**`, `GET /api/comments/**`.
  - `AUTHENTICATED`: `POST /api/posts/**`, `POST /api/communities/**`, `POST /api/comments/**`.

### 2. Database Integration & Entities (MySQL)
- **Database Schema**: Managed by Flyway (`backend/src/main/resources/db/migration/V1__initial_schema.sql`).
- **Entities & Repositories**:
  - `User` (`users`), `Role` (`roles`), `Community` (`communities`), `Post` (`posts`), `Comment` (`comments`), `PostVote` (`post_votes`).
  - Repositories: `UserRepository`, `RoleRepository`, `CommunityRepository`, `PostRepository`, `CommentRepository`, `PostVoteRepository`.
- **Foreign Key Constraints**: Handled automatically in `ForumController` by attaching the authenticated `User` from the SecurityContext to `creator` (`created_by`) and `author` (`author_id`).

### 3. REST API Endpoints ([ForumController.java](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/backend/src/main/java/com/forumhub/controller/ForumController.java))
- `POST /api/auth/register`: Validates uniqueness, hashes password, saves user in MySQL, returns JWT token & user info.
- `POST /api/auth/login`: Authenticates username/email & password, returns JWT token & user info.
- `GET /api/communities` & `POST /api/communities`: List or create communities (authenticated).
- `GET /api/posts` & `POST /api/posts`: Paginated post listing and creation (authenticated author).
- `POST /api/posts/{id}/vote`: Upvote (+1), downvote (-1), or reset vote (0), recalculating score in MySQL.
- `GET /api/posts/{id}/comments` & `POST /api/posts/{id}/comments`: View comments and add comment replies (authenticated author).

### 4. Frontend UI ([main.jsx](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/frontend/src/main.jsx))
- **Auth Management**: Log In / Sign Up modal, JWT token persistence (`localStorage.getItem('forumhub_token')`), user badge in header, log out button.
- **Protected Actions**: Sends `Authorization: Bearer <token>` for all state-modifying requests.
- **Interactions**:
  - Upvote/Downvote buttons (`▲` / `▼`) with real-time UI score updates.
  - Create Post modal dialog with community selector.
  - Create Community modal dialog (`+ Community`).
  - Comments expander (`💬 X Comments`) with comment creation input.

## How to Run locally
1. **Database & Backend**:
   - Ensure MySQL 8 is running on port 3306 with database `forumhub`.
   - Configure `.env` or `application.yml` for DB credentials if different from `root`/`root`.
   - In `backend/`: Run `mvn spring-boot:run` (or use `./setup-maven.ps1` to install Maven via winget).
   - Health check: `http://localhost:8080/api/health`.
2. **Frontend**:
   - In `frontend/`: Run `npm install` and `npm run dev`.
   - Open `http://localhost:5173`.
