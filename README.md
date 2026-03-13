# Chore Games

Ionic 8 + Angular 20 + Capacitor 8 PWA for tracking kids' chores and weekly earnings.

## Quick Start

```bash
npm install
npm run start          # dev server on http://localhost:18330
```

Dev server runs on **port 18330** (LAN: `http://<your-ip>:18330`).  
Backend API: shared Express server at `:18310` (same as `flint-ionic-dashboard`).

## Routes

| Path | Page |
|------|------|
| `/home` | Stats dashboard — today's progress + player balances |
| `/chores` | Today's chore list, kid switcher, mark-done button |
| `/rewards` | Reward catalog, balance check, redeem flow |
| `/leaderboard` | Family earnings ranking |

## Backend API (shared with dashboard)

All `/api/chores/*` routes need to be added to the Express server in  
`/Users/jd/Documents/ai-ml/openclaw-instance/apps/flint-ionic-dashboard/backend/`.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/chores` | List all chores |
| POST | `/api/chores` | Create chore |
| PATCH | `/api/chores/:id` | Update chore |
| GET | `/api/chores/logs/today` | Today's completion logs |
| POST | `/api/chores/logs` | Mark a chore done |
| GET | `/api/chores/stats` | Dashboard stats |
| GET | `/api/chores/earnings/:kidId/week` | Weekly earnings |
| GET | `/api/chores/kids` | List kids |
| POST | `/api/chores/kids` | Add kid |
| GET | `/api/chores/rewards` | List rewards |
| POST | `/api/chores/rewards/redeem` | Redeem reward |

## Data Models

- `src/app/models/chore.model.ts` — `Chore`, `ChoreLog`, `ChoreStats`, `WeeklyEarnings`
- `src/app/models/family.model.ts` — `KidProfile`, `Reward`, `RewardRedemption`

## Services

- `ChoreService` — all HTTP calls to `/api/chores/*`
- `SocketService` — real-time events (`chore:completed`, `reward:redeemed`, `leaderboard:update`)

## Capacitor (iOS)

Bundle ID: `com.openclaw.choregames`

```bash
npm run build:pwa
npx cap add ios
npx cap sync
npx cap open ios
```

## Build + Lint

```bash
npm run lint
npm run build
```

## Docs

See `docs/PWA_IONIC_QUICKSTART.md` for the init + proxy pattern used to bootstrap this app.
