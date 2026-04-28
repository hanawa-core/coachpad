# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

PowerShell script execution is disabled on this machine. Run npm via node directly:

```powershell
# Dev server
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev

# Production build (always verify this passes before finishing)
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build

# Lint
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run lint
```

No test suite exists in this project.

## Stack & Versions (breaking-change-sensitive)

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.2.4 (Turbopack) | **Not the Next.js you know** — read `node_modules/next/dist/docs/` before writing routes |
| React | 19.2.4 | |
| Tailwind CSS | v4 | No `tailwind.config.js`. No `@apply` with config tokens. Utility classes only. |
| Zod | v4 | `.parse()` / `.safeParse()` API unchanged; some schema methods differ |
| Firebase client | v12 | |
| Firebase Admin | v13 | |
| `@anthropic-ai/sdk` | 0.91.1 | `client.messages.create()` supports `output_config` for structured JSON without beta flag |
| lucide-react | 1.11.0 | |

## Architecture

### Role model
Two roles: `coach` and `athlete`. All pages under `app/(app)/` are protected by `AuthProvider`. Role-specific rendering is done at the component level — pages check `profile.role` via `useAuth()`.

### Firebase usage
- **Client SDK** (`lib/firebase/config.ts`): exports `auth`, `db`, `storage`. Used in all client components.
- **Admin SDK** (`lib/firebase/admin.ts`): used only in API routes (`app/api/`). Credentials via `FIREBASE_SERVICE_ACCOUNT_BASE64` env var (base64-encoded service account JSON).
- **Firestore patterns**: client-side uses `onSnapshot` for real-time subscriptions; admin-side uses `adminDb()` factory function. All Firestore queries are in `lib/firebase/firestore.ts` (client) — server routes query directly via `adminDb()`.

### Firestore collections
| Collection | Description |
|---|---|
| `users/{uid}` | UserProfile. Athletes have `coachId` field. |
| `users/{uid}/aiProfile/main` | CoachAiProfile sub-document |
| `athletes/{id}` | AthleteCache — denormalized summary for coach dashboard (CTL/ATL/TSB, last logged dates). Updated when athlete logs workouts. |
| `workouts/{id}` | Workout records. Fields: `athleteId`, `coachId`, `date` (YYYY-MM-DD), `type`, `planned`, `completed`, `coachFeedback` |
| `wellnessEntries/{id}` | Daily wellness. Fields: `athleteId`, `date` (YYYY-MM-DD) |
| `strengthAssignments/{id}` | Strength session assigned to athlete |
| `strengthTemplates/{id}` | Reusable strength protocols |
| `chats/{threadId}` | Thread ID = `${coachId}_${athleteId}` |
| `chats/{threadId}/messages/{id}` | Chat messages |
| `motionAnalyses/{id}` | Video analysis uploads |
| `aiTeamAnalysis/{coachId}` | AI team analysis cache (6-hour TTL) |

### AI integration
All AI calls are server-side only (`app/api/ai/`). Pattern:
1. `buildSystemPromptWithCoach(coachId, BASE_PROMPT)` — returns `TextBlockParam[]` with coach's AI profile + base prompt. Coach profile block has `cache_control: { type: 'ephemeral' }` for prompt caching.
2. `client.messages.create({ ..., output_config: { format: { type: 'json_schema', schema: {...} } } })` — structured JSON output (no beta flag needed).
3. For routes using Anthropic Files API: use `client.beta.messages.create` with `betas: ['files-api-2025-04-14']`.
4. Models: `MODEL_HIGH` (Opus) for running plans, `MODEL_STANDARD` (Sonnet) for everything else. Controlled by `AI_TIER` env var.

### Auth pattern in API routes
```typescript
const auth = req.headers.get('authorization')
const decoded = await adminAuth().verifyIdToken(auth.substring('Bearer '.length))
const userId = decoded.uid
```

### Component conventions
- All interactive components are `'use client'`. Server components are thin page shells.
- `useAuth()` hook provides `{ user, profile, loading }`.
- Styling: dark slate theme (`slate-900` bg, `slate-800` borders, `emerald-*` accents). Use `clsx` for conditional classes.
- Icons: `lucide-react` only.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_*` — 6 Firebase client config vars
- `FIREBASE_SERVICE_ACCOUNT_BASE64` — admin SDK credentials
- `ANTHROPIC_API_KEY`
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXTAUTH_URL`
- `AI_TIER` — optional: `economy` | `balanced` | `premium` (default: `balanced`)
