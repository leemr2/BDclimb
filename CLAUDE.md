# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production (builds service worker first, then Next.js)
npm run start            # Start production server
npm run lint             # Run ESLint
```

The build step runs two things in sequence: `npx esbuild auth-service-worker.js --bundle --outfile=public/auth-service-worker.js` then `next build`. If the service worker source (`auth-service-worker.js` at project root) changes, it must be rebuilt before the Next.js build.

No test framework is configured.

## Architecture

**Stack**: Next.js App Router + TypeScript + Tailwind CSS v4 + Firebase (Auth + Firestore)

This is a community scheduling app for a climbing gym where authenticated users can see who else is working out at a given time and chat with each other.

### App Structure

```
src/app/
├── layout.tsx              # Root layout — wraps everything in <AuthProvider>
├── page.tsx                # Landing/hero page; redirects to /community if logged in
├── (auth)/                 # Route group: login and signup pages share a layout
└── community/page.tsx      # Main app: calendar + chat (protected route)
    training-center/page.tsx # Placeholder page (coming soon)
```

Route protection is client-side: pages use `useAuth()` and redirect to `/` if `user` is null.

### Authentication

`src/lib/firebase/auth.tsx` exports `AuthProvider` and the `useAuth()` hook. The provider wraps the entire app (in root layout) and exposes: `user`, `loading`, `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `sendPasswordResetEmail`, `confirmPasswordReset`.

A service worker (`auth-service-worker.js`) is built with esbuild and syncs Firebase auth state across browser tabs.

### Firebase / Data Layer

All backend logic goes through Firebase. No traditional server-side API routes exist.

**Firestore collections:**

| Collection | Purpose | Owner field |
|---|---|---|
| `users` | User profiles (`displayName`, `email`) | `userId` |
| `calendar` | Workout commitments per date+time | `userId` |
| `messages` | Community chat messages | `userId` |

Security rules enforce that authenticated users can read all records but can only write/delete their own. See `firestore.rules` for specifics.

Data access functions live in `src/lib/firebase/`:
- `calendar.ts` — CRUD for calendar entries
- `messages.ts` — CRUD for chat messages
- `users.ts` — user profile operations
- `client.ts` / `server.ts` — Firebase SDK initialization (client vs. server contexts)

Real-time updates use Firestore `onSnapshot()` listeners set up inside `useEffect` hooks within page components. Calendar entries are queried per date; messages are ordered by `createdAt` descending and reversed client-side for display.

### Environment Variables

Firebase config is sourced from environment variables. `src/lib/envs/client.ts` and `src/lib/envs/server.ts` validate these at runtime using Zod. The required variables (prefixed `NEXT_PUBLIC_FIREBASE_*` for client-side) must be present in `.env.local`.

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`). Use this for all imports within `src/`.

### Calendar UI

The calendar operates on 30-minute time blocks from 6 AM to 10 PM. `Calendar.tsx` renders the month view; `CalendarDaySummary.tsx` shows a day's committed users; `TimeBlock.tsx` represents a single slot. Users can commit with status `"thinking"` or `"confirmed"`.

### Styling Notes

Tailwind CSS v4 is used (PostCSS-based, configured in `postcss.config.mjs`). A day/night mode toggle is persisted in `localStorage`. The hero page uses GSAP and Three.js for an animated neural-network background (`components/ui/neural-network-hero.tsx`).
