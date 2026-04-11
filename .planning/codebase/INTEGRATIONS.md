# External Integrations

**Analysis Date:** 2026-04-10

## APIs & Backend Services

### Deen FastAPI Backend
- **Base URL (prod):** `https://deen-fastapi.duckdns.org`
- **Base URL (dev):** auto-detected LAN IP at port `8080` (e.g. `http://192.168.x.y:8080`)
- **Client:** native `fetch` and `XMLHttpRequest` in `utils/api.ts`
- **Auth:** `Authorization: Bearer <access_token>` on all requests via `withAuthHeaders()` helper
- **All endpoints require auth** unless token is unavailable (graceful degradation in some cases)

**Endpoints called from `utils/api.ts`:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/chat/stream` | Legacy streaming chat (XHR + `onprogress`) |
| POST | `/chat/stream/agentic` | Agentic SSE chat with status, chunks, hadith/quran refs |
| GET | `/chat/saved` | List saved chat sessions (paginated) |
| GET | `/chat/saved/{session_id}` | Fetch full chat history for a session |
| POST | `/references/` | Search Islamic references (Shia + Sunni) |
| GET | `/hikmah-trees` | List hikmah learning trees |
| GET | `/hikmah-trees/{tree_id}` | Single hikmah tree |
| GET | `/lessons` | List lessons (filtered by `hikmah_tree_id`) |
| GET | `/lessons/{lesson_id}` | Single lesson |
| GET | `/lesson-content` | Paginated content blocks for a lesson |
| GET | `/hikmah/pages/{content_id}/quiz-questions` | MCQ quiz for a lesson page |
| POST | `/hikmah/pages/{content_id}/quiz-submit` | Submit a quiz answer (fire-and-forget) |
| GET | `/user-progress` | List user progress records |
| POST | `/user-progress` | Create progress record |
| PATCH | `/user-progress/{progress_id}` | Update progress record |
| GET | `/primers/{lesson_id}/baseline` | Fetch baseline primer bullets |
| POST | `/primers/personalized/stream` | SSE stream of personalized primer bullets |
| POST | `/elaboration` (inferred from components) | AI elaboration on selected lesson text |

**Streaming transport:** XHR `onprogress` pattern used for all SSE endpoints (not native EventSource) for Expo Go compatibility. SSE frame format: `event: <name>\ndata: <json>\n\n`.

**Timeout values:**
- Chat streaming: 30 s (`/chat/stream`), 60 s (`/chat/stream/agentic`)
- Primer streaming: 30 s
- All other requests: default fetch timeout (none set explicitly)

---

## Auth Providers

### AWS Cognito (OIDC / OAuth 2.0 PKCE)
- **Implementation:** `utils/auth.ts`
- **Pool region:** `eu-north-1`
- **User Pool ID:** `eu-north-1_nKO9a23pF`
- **Client ID:** `1bukdrndjlh653q4ddfnmelunq` (public value; safe in client)
- **Hosted UI domain:** `https://eu-north-1nko9a23pf.auth.eu-north-1.amazoncognito.com`
- **Issuer:** `https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_nKO9a23pF`
- **Scopes:** `openid email phone`
- **PKCE flow library:** `expo-auth-session` (`AuthSession.AuthRequest` with `usePKCE: true`)
- **Browser opener:** `expo-web-browser` (`WebBrowser.openAuthSessionAsync`)

**Two redirect URI strategies (toggled by `isExpoGo()`):**

| Context | Redirect URI | Mechanism |
|---------|-------------|-----------|
| Expo Go | `https://auth.expo.io/@snassabi7/deen-react-native` | Proxy bounce via `/start?authUrl=&returnUrl=` |
| Standalone / dev-client | `deenreactnative://auth` | Direct deep link via `AuthSession.makeRedirectUri` |

**Token storage:** `expo-secure-store` key `deen.auth.tokens` (JSON: `accessToken`, `idToken`, `refreshToken`, `accessTokenExpiresAt`). Falls back to `AsyncStorage` on web.

**Token refresh:** `getValidAccessToken()` in `utils/auth.ts` auto-refreshes using `refresh_token` grant when access token is within 30 s of expiry.

**Sign-out:** `signOut({ global: true })` revokes via Cognito `/logout` endpoint + clears local storage.

---

## Third-party SDKs

### Expo SDK Modules
- `expo-constants` — reads runtime config (`appOwnership`, `hostUri`, `isDevice`) to drive environment detection in `utils/config.ts`
- `expo-secure-store` — hardware-backed keychain on iOS/Android for auth tokens
- `expo-auth-session` — PKCE OAuth2 request builder and response parser
- `expo-web-browser` — opens Cognito hosted UI in an in-app browser session
- `expo-linking` — deep link parsing for auth redirect callbacks
- `expo-haptics` — haptic feedback on tab press (`HapticTab` component)
- `expo-clipboard` — clipboard write for reference card copy feature
- `expo-linear-gradient` — gradient UI elements
- `expo-blur` — blur overlays
- `expo-splash-screen` — controlled splash screen hide after font load in `app/_layout.tsx`
- `expo-image` — optimized image loading
- `expo-symbols` — SF Symbols on iOS

### No Third-party Analytics, Payments, or Notifications
- No analytics SDK (e.g. Segment, Amplitude, Firebase Analytics) detected
- No payment processing SDK detected
- No push notification service (FCM, APNs, Expo Notifications) detected
- No crash reporting SDK (e.g. Sentry, Bugsnag) detected

---

## Environment Configuration

### Config Source
All config is centralized in `utils/config.ts` and exported as a `CONFIG` const object. It reads `EXPO_PUBLIC_*` env vars at build time.

### Environment Variables

| Variable | Default (dev) | Default (prod) | Purpose |
|----------|--------------|----------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | auto-detected LAN IP `:8080` | `https://deen-fastapi.duckdns.org` | Backend API base URL |
| `EXPO_PUBLIC_COGNITO_DOMAIN` | `https://eu-north-1nko9a23pf.auth.eu-north-1.amazoncognito.com` | same | Cognito hosted UI domain |
| `EXPO_PUBLIC_COGNITO_CLIENT_ID` | `1bukdrndjlh653q4ddfnmelunq` | same | Cognito app client ID |
| `EXPO_PUBLIC_COGNITO_ISSUER` | `https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_nKO9a23pF` | same | OIDC issuer URL |
| `EXPO_PUBLIC_COGNITO_SCOPES` | `openid email phone` | same | OIDC scopes (space-delimited) |
| `EXPO_PUBLIC_AUTH_REDIRECT_URI` | `https://auth.expo.io/@snassabi7/deen-react-native` | app deep link | Auth callback URI |

No `.env` file is required for local development. The config auto-detects the dev machine's LAN IP from `expo-constants` `hostUri`. A `.env.appstore` file exists in the repo root (contents not read).

### `CONFIG` object keys (from `utils/config.ts`)
- `CONFIG.API_BASE_URL`
- `CONFIG.CHAT_EXPIRY_SECONDS` — `1440` (24 min; aligns with backend Redis TTL)
- `CONFIG.COGNITO_DOMAIN`
- `CONFIG.COGNITO_CLIENT_ID`
- `CONFIG.COGNITO_ISSUER`
- `CONFIG.COGNITO_SCOPES`
- `CONFIG.AUTH_REDIRECT_URI`

### AsyncStorage Keys (from `utils/constants.ts`)
- `deen:sessionId` — current chat session UUID
- `deen:msgs:<sessionId>:v1` — chat message cache with TTL
- `deen:chatLanguage:<sessionId>` — per-session chat language
- `deen:lastChatLanguage` — most recently used language
- `@deen_theme_preference` — light/dark/system preference

---

*Integration audit: 2026-04-10*
