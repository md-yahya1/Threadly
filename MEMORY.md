# Threadly (ForumHub) — Project Memory

Reddit-like forum: communities, posts, nested comments, voting, JWT auth with
refresh tokens. Read this fully before touching code — it replaces manual
file exploration.

## Stack
- **Backend**: Java 21, Spring Boot 3.5, Spring Security (stateless JWT), Spring
  Data JPA, Flyway, MySQL 8, Maven.
- **Frontend**: React 18, Vite, vanilla CSS (no Tailwind/CSS-in-JS), `lucide-react` icons.
- **Deploy**: Single Docker image — frontend built and copied into
  `backend/src/main/resources/static`, served by the Spring Boot JAR. Render.com,
  service `threadly-backend-4ozb.onrender.com`. **Build context must be repo
  root**, not `backend/` — both `Dockerfile` (root) and `backend/Dockerfile`
  `COPY frontend/...` relative to root.

## Repo layout (everything that matters)
```
backend/src/main/java/com/forumhub/
  ForumHubApplication.java
  config/
    JwtTokenProvider.java       # generates + validates access/refresh JWTs
    JwtAuthenticationFilter.java # reads Bearer header, sets SecurityContext
    SecurityConfig.java         # route auth rules, CORS, PasswordEncoder bean
    WebConfig.java              # SPA fallback: non-/api routes -> index.html
  controller/
    ForumController.java        # ALL endpoints live here (single controller, by design)
    HealthController.java       # GET /api/health
  dto/Requests.java             # ALL request/response records live here (single file)
  entity/                       # User, Role, Community, Post, Comment, PostVote
  repository/                   # one interface per entity + Repositories.java (marker/import hub)
  exception/ApiExceptionHandler.java  # @RestControllerAdvice: NoSuchElementException->404,
                                       # MethodArgumentNotValidException->400, Exception->400
backend/src/main/resources/
  application.yml
  db/migration/V1__initial_schema.sql   # only migration; full schema incl. bio/avatar_url

frontend/src/
  App.jsx                       # top-level state: posts, communities, filters, modal toggles
  services/api.js               # single fetch wrapper + all api.* calls + token refresh logic
  context/
    AuthContext.jsx             # user/token state, login/register/logout/updateUser
    ThemeContext.jsx            # light/dark
    ToastContext.jsx            # addToast(msg, type)
  components/
    layout/  Header, LeftSidebar, RightSidebar, MobileNav
    posts/   PostCard, PostSkeleton
    comments/ CommentSection
    modals/  AuthModal, CreatePostModal, CreateCommunityModal, AccountSettingsModal
    common/  Avatar, Toast
  utils/ avatar.js (initials/color), time.js (relative time)
```

**Convention**: this project deliberately keeps ONE controller and ONE DTO file
instead of splitting per-resource. Follow that pattern when adding endpoints —
add methods to `ForumController.java` and records to `Requests.java`, don't
create new controller/DTO files unless asked.

## Auth system (as of the refresh-token patch)
- Login/register return `{ token, refreshToken, id, username, email, message }`.
- Access token: 30 min (`app.jwt.access-minutes`), carries `claim("type","access")`.
- Refresh token: 14 days (`app.jwt.refresh-days`), carries `claim("type","refresh")`.
  Stateless — no DB storage/revocation list. Logout does NOT invalidate
  outstanding tokens server-side.
- `POST /api/auth/refresh` — body `{ refreshToken }` → new token pair.
- Frontend `services/api.js`: on any 401/403 from an authenticated call (never
  from `/auth/login|register|refresh` themselves), it silently calls
  `/auth/refresh` once, retries the original request, and only surfaces an
  error if the refresh itself fails (refresh token dead) — then clears session
  and calls `onSessionExpired()` (wired in `AuthContext` to log the user out +
  reopen the login modal with a toast).
- localStorage keys: `forumhub_token`, `forumhub_refresh_token`, `forumhub_user`.
- **Gotcha**: tokens issued before this patch lack the `type` claim and will
  fail `validateToken` now — expected, just requires one re-login.

## SecurityConfig route rules (in order)
```
permitAll:  /api/health, /api/auth/**
permitAll:  GET /api/posts/**, GET /api/communities/**, GET /api/comments/**
authenticated: /api/** (everything else under /api, any method)
permitAll:  anyRequest() (i.e. SPA static routes)
```
CORS origins: `app.cors.allowed-origins` (default includes localhost:3000,
localhost:5173, `https://*.onrender.com`). `allowCredentials(true)` +
`addAllowedOriginPattern` (not `addAllowedOrigin`) — required combo when
credentials are on.

## API endpoints (ForumController, base path `/api`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | uniqueness check on username+email |
| POST | `/auth/login` | public | accepts username OR email |
| POST | `/auth/refresh` | public | exchanges refresh token for new pair |
| GET | `/users/me` | required | current profile |
| PUT | `/users/me` | required | update `bio`, `avatarUrl` only |
| PUT | `/users/me/password` | required | verifies `currentPassword` first |
| GET | `/communities` | public | |
| POST | `/communities` | required | name must be unique |
| GET | `/posts?page&size` | public | paginated, sorted by createdAt desc |
| POST | `/posts` | required | |
| POST | `/posts/{id}/vote` | required | body `{value: -1\|0\|1}`, idempotent score diff |
| GET | `/posts/{id}/comments` | public | |
| POST | `/posts/{id}/comments` | required | optional `parentCommentId` for nesting |

## Entities (fields beyond obvious id/timestamps)
- **User**: `username`, `email`, `passwordHash`, `bio`, `avatarUrl`, `karma`,
  `status="ACTIVE"`, roles (M2M, eager).
- **Community**: `name` (unique), `description`, `visibility="PUBLIC"`,
  `iconUrl`, `bannerUrl`, `creator` (User).
- **Post**: `community`, `author`, `title`, `content`, `postType="TEXT"`,
  `externalUrl`, `score`, `commentCount`, `status`, `locked`.
- **Comment**: `post`, `parent` (self-ref for nesting), `author`, `content`,
  `score`, `status`, `locked`.
- **PostVote**: composite key `(userId, postId)`, `value` (byte, -1/0/1).
- **Role**: just `name` (e.g. "USER"), seeded lazily on first register.

## Frontend patterns to reuse
- **Modals**: copy `CreateCommunityModal.jsx` structure — `modal-backdrop` →
  `post-modal-card` (shared CSS from `CreatePostModal.css`) → `modal-header`
  w/ `X` close → `post-modal-form` → `form-group`/`form-input`/`form-textarea`
  → `modal-footer` w/ Cancel + primary action. Component-specific CSS only for
  what's not already in the shared classes.
- **API calls**: add one arrow fn to the `api` object in `services/api.js`,
  calling the shared `request(endpoint, options)`. Never call `fetch`
  directly elsewhere.
- **Toasts**: `const { addToast } = useToast(); addToast(msg, 'success'|'error'|'info')`.
- **Auth-gated UI**: `const { isAuthenticated, user, openAuthModal } = useAuth();`
  gate actions with `isAuthenticated ? doThing() : openAuthModal('login')`.
- **New modals get wired in `App.jsx`**: add `show___` state, pass an
  `onOpen___` callback down to `Header`/wherever triggers it, mount
  `<___Modal isOpen={} onClose={} />` near the other modals at the bottom.

## Known dead code / debt (don't be surprised, don't "fix" without asking)
- `Requests.java` has 3 near-duplicate registration records (`Register`,
  `RegisterRequest`, `SignupRequest`) — only `Register` is actually used.
- No username/email editing in Account Settings yet (bio + avatarUrl only) —
  intentionally scoped out due to uniqueness-check complexity.
- No password-change session invalidation — other devices' tokens stay valid
  until natural expiry.
- No rate limiting anywhere.

## Local dev
```
# backend (needs MySQL running on 3306, db `forumhub`)
cd backend && mvn spring-boot:run          # localhost:8080

# frontend (vite proxies /api -> localhost:8080, see vite.config.js)
cd frontend && npm install && npm run dev  # localhost:5173
```
Env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
`JWT_EXPIRATION_MINUTES`, `ALLOWED_ORIGINS`, `PORT`.

## Change log (recent sessions)
- Added Account Settings feature: profile (bio/avatarUrl) + password change,
  `AccountSettingsModal.jsx`, `GET/PUT /users/me`, `PUT /users/me/password`.
- Added refresh-token auto-renewal: `JwtTokenProvider` now issues typed
  access/refresh tokens, `/auth/refresh` endpoint, `api.js` silent retry-on-401/403.
