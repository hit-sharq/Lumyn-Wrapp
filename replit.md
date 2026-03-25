# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This project contains Lumyn Wrapp — a Web-to-APK conversion SaaS by Lumyn Technologies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, Shadcn/UI, Framer Motion
- **Auth**: Clerk (via `@clerk/clerk-react`) — requires `VITE_CLERK_PUBLISHABLE_KEY` env var
- **Payments**: PesaPal — requires `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_IPN_ID`

## Lumyn Wrapp — Product Overview

**Lumyn Wrapp** converts web apps into Android APK files via a subscription model. No free tier.

### Subscription Plans (stored in DB, seeded on server start)
- **Starter** — $19/month — 3 conversions/month
- **Pro** — $49/month — 15 conversions/month
- **Business** — $99/month — Unlimited conversions/month

### Pages
- `/` — Landing page (hero, features, pricing preview, CTA)
- `/pricing` — Full pricing page with plan cards (live from DB)
- `/sign-in` — Clerk sign-in (shows "not configured" message if no valid Clerk key)
- `/sign-up` — Clerk sign-up (shows "not configured" message if no valid Clerk key)
- `/dashboard` — User dashboard: subscription status + conversion jobs list
- `/convert` — Create a new conversion job (requires active subscription)
- `/conversions/:id` — Conversion job detail with status polling

### Auth Pattern
- When `VITE_CLERK_PUBLISHABLE_KEY` starts with `pk_`, ClerkProvider wraps the app
- All Clerk hooks are guarded by `useSafeAuth()` — returns empty defaults when Clerk is not configured
- Frontend sends `Authorization: Bearer <token>` + user ID via Clerk token
- Backend reads `x-clerk-user-id` header for auth

### Adding Credentials (when ready)
1. **Clerk**: Set `VITE_CLERK_PUBLISHABLE_KEY` (frontend publishable key from Clerk dashboard)
2. **PesaPal**: Set `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_IPN_ID`
3. **App URL**: Set `APP_URL` to your production domain (e.g. `https://lumynwrapp.com`)
4. **PesaPal env**: Set `PESAPAL_ENV=production` for live payments (default is sandbox)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── lumyn-wrapp/        # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `users` — Synced from Clerk (clerkId, email, name, imageUrl)
- `plans` — Subscription plans (seeded on server start)
- `subscriptions` — User subscriptions with PesaPal tracking
- `conversion_jobs` — Web-to-APK conversion job records

## API Routes

- `GET /api/healthz` — Health check
- `GET /api/users/me` — Get current user
- `POST /api/users/sync` — Sync user from Clerk after sign-in
- `GET /api/plans` — List subscription plans
- `GET /api/subscriptions/me` — Get user's active subscription + usage
- `POST /api/subscriptions/checkout` — Initiate PesaPal checkout
- `GET /api/subscriptions/callback` — PesaPal payment callback
- `GET /api/conversions` — List user's conversion jobs
- `POST /api/conversions` — Create new conversion job
- `GET /api/conversions/:id` — Get conversion job details
- `GET /api/conversions/:id/status` — Poll conversion status

## Root Scripts

- `pnpm run build` — runs typecheck then builds all packages
- `pnpm run typecheck` — runs tsc --build --emitDeclarationOnly
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
