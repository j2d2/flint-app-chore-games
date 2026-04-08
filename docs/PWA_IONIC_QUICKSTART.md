## Session: flint-app-chore-games — New Ionic/Angular PWA

### Goal
Bootstrap a new Ionic + Angular + Capacitor app (`flint-app-chore-games`) that is a 
clean clone of the `flint-ionic-dashboard` frontend structure, connected to the same  
Express backend service at `http://127.0.0.1:18310`.

### App repo
`/Users/jd/Documents/ai-ml/flint-instance/apps/flint-app-chore-games`

### Reference app (clone structure from)
`/Users/jd/Documents/ai-ml/flint-instance/apps/flint-ionic-dashboard`

Key files to examine before starting:
- `angular.json`, `ionic.config.json`, `capacitor.config.ts` — project config
- `src/app/app.module.ts`, `src/app/app-routing.module.ts` — module/routing setup
- `src/app/app.component.html` — split-pane sidebar shell
- `src/app/services/task.service.ts`, `src/app/services/socket.service.ts` — backend services
- `proxy.conf.json` — dev proxy `/api` → `http://127.0.0.1:18310`
- `backend/` does NOT need to be cloned — chore-games shares the dashboard backend

### What to scaffold
1. New Ionic Angular standalone-components app with same proxy config pointing to `:18310`  
2. Same `ion-split-pane` shell with sidemenu  
3. Shared models: copy `src/app/models/` (agent-task.model.ts, channel.model.ts)  
4. Shared services: copy `src/app/services/` (task.service.ts, socket.service.ts, approval.service.ts)  
5. Home page: game-themed dashboard (kids chore tracking) — placeholder is fine for now  
6. Capacitor configured for iOS native build target (bundle ID: `com.flint.choregames`)  
7. `PWA_IONIC_QUICKSTART.md` in repo root documenting the setup pattern

### Port Assignment Policy ⚠️

**Never use default ports (4200, 8100, 3000, 5000, 8080, etc.).** Default ports collide across apps in parallel dev and produce silent failures — the wrong server answers, or nothing answers and the error is non-obvious.

Every app and backend in this workspace gets a unique port in the `183xx` range, hardcoded in three places:

| Service | Port | Config location |
|---------|------|-----------------|
| Express backend | `18310` | `backend/src/index.ts`, `proxy.conf.json` |
| flint-ionic-dashboard (Angular) | `18320` | `angular.json` → `serve.options.port`, `package.json` `start` script |
| flint-app-chore-games (Angular) | `18330` | same pattern |
| Flint MCP | `18765` | `flint-mcp` config |

**Wire it in `angular.json`** (not just the CLI flag — the flag is forgotten next session):
```json
"serve": {
  "options": {
    "port": 18330,
    "host": "0.0.0.0"
  }
}
```

**And in `package.json`** so `npm start` never defaults back to 4200:
```json
"start": "ng serve --port 18330 --host 0.0.0.0"
```

**Quick health check for any session start:**
```bash
lsof -ti :18310 && echo 'backend OK' || echo 'backend DOWN'
lsof -ti :18330 && echo 'angular OK' || echo 'angular DOWN'
curl -s http://localhost:18310/api/tasks | head -c 80
```

### Backend connectivity
- Dev: proxy `/api` → `http://127.0.0.1:18310` (same Express server as dashboard)  
- The backend serves task queue + Flint MCP — chore games will add its own routes later  
- LAN dev access: serve on `0.0.0.0:18330` (different port from dashboard's 18320)

### This is NOT a copy of the dashboard UI
- Different theme (bright/playful vs dark/pro)
- Different pages (chore list, rewards, leaderboard — scaffold as empty pages)  
- Same technical foundation (module structure, routing, services, proxy)

### Quickstart template to produce
Create `PWA_IONIC_QUICKSTART.md` in the repo that documents:
- How to init a new Ionic Angular app from scratch
- Proxy config for shared backend
- Capacitor iOS setup steps
- LAN dev serving pattern
- File budget rules (CSS per component < 2 kB)
- How to connect to Flint backend routes

---

One question to decide before chore-games gets too far: shared backend vs its own — right now it points to :18310 (the dashboard backend). Eventually chore-games will want its own domain logic (chores, kids, rewards). The cleanest path is to add a `POST /api/chores/*` route group to the existing Express server so both apps share one backend process. Worth deciding that at session start so the new session scaffolds correctly.
