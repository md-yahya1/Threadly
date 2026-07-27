# Walkthrough - Serving Threadly Frontend from Spring Boot Backend & End-to-End Auth Fix

## Summary
The Threadly React frontend has been embedded into the Spring Boot backend static resources and configured to run on the **same origin** (`https://threadly-backend-4ozb.onrender.com`). This unifies deployment into a single self-contained executable JAR, eliminates cross-origin/CORS friction for authenticated actions (Create Post, Create Community, Vote, Comment), and ensures SPA deep links work on browser refresh.

---

## Files Changed

### Frontend
- **[api.js](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/frontend/src/services/api.js)**: Changed `API_BASE` to `import.meta.env.VITE_API_URL || '/api'` for relative same-origin API calls. Audited request helper to guarantee `Authorization: Bearer <token>` is present on all authenticated requests.
- **[vite.config.js](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/frontend/vite.config.js)** *(NEW)*: Created Vite configuration with React plugin and local dev proxy (`/api` -> `http://localhost:8080`).

### Backend
- **[WebConfig.java](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/backend/src/main/java/com/forumhub/config/WebConfig.java)** *(NEW)*: Implemented `WebMvcConfigurer` with a custom `PathResourceResolver` to forward non-`/api/**` client routes (e.g., `/community/1`) to `index.html`.
- **[SecurityConfig.java](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/backend/src/main/java/com/forumhub/config/SecurityConfig.java)**: Updated `authorizeHttpRequests` to permit all frontend static assets and SPA routes, while strictly enforcing JWT authentication on protected `/api/**` endpoints.

### Build Pipeline & Repository Configuration
- **[Dockerfile](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/backend/Dockerfile)** & **[Dockerfile](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/Dockerfile)**: Implemented 3-stage multi-stage build:
  1. `frontend-build` (`node:20-alpine`): Runs `npm ci && npm run build`.
  2. `backend-build` (`maven:3.9-eclipse-temurin-21`): Copies built `dist/` into `backend/src/main/resources/static/` and runs `mvn clean package -DskipTests`.
  3. `runtime` (`eclipse-temurin:21-jre`): Runs `java -jar app.jar` on port 8080.
- **[.gitignore](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/.gitignore)**: Added `backend/src/main/resources/static/`.

### Tests
- **[SecurityConfigTest.java](file:///c:/Users/Mohammed%20yahya/OneDrive/Desktop/Threadly/backend/src/test/java/com/forumhub/SecurityConfigTest.java)**: Updated test suite to verify SPA fallback routes (`GET /`, `GET /community/1`) serve `index.html` (200 OK) while protected API routes require JWT authentication.

---

## Verification Results

### Build Pipeline & Test Execution
1. **Frontend Build**: `npm run build` executed cleanly in 2.8s, creating static bundle chunks in `dist/`.
2. **Resource Embedding**: Embedded `index.html` and `assets/` into `backend/src/main/resources/static/`.
3. **Spring Boot Test**: `mvn test` passed **5/5 tests** with 0 failures or errors. Log confirmed Spring Boot recognized embedded static resources:
   `Adding welcome page: class path resource [static/index.html]`
4. **Spring Boot Package**: `mvn package` created the runnable archive `forumhub-api-0.0.1.jar` containing the full React app and REST API.
