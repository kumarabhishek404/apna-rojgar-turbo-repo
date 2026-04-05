# CLAUDE.md — Apna Rojgar (pnpm + Turborepo monorepo)

Project rules and codebase patterns for AI coding sessions and engineers. Paths are relative to the **repository root** (`apna-rojgar-turbo-repo`).

This repository is a **monorepo**: **pnpm workspaces** + **Turborepo**. Always scope edits and commands to the correct app or package.

---

## 0. DEFAULT WORKFLOW — AI METHODOLOGY

For any **new feature, enhancement, or UI improvement** on the mobile app, follow the 5-phase pipeline in `.agents/skills/ai-methodology/SKILL.md`.

**How to apply:**

1. Read `.agents/skills/ai-methodology/SKILL.md` at the start of the task.
2. Follow: Requirements → Prototyping → Implementation → Testing → Documentation.
3. Store artifacts under **`apps/mobile/docs/features/{feature-slug}/`** (mobile feature docs live inside the app workspace).

---

## 1. REPOSITORY LAYOUT

```
apna-rojgar/                    # repo root (package name: apna-rojgar)
├── package.json                # root scripts: dev, build, lint, clean; prepare → builds @repo/common
├── pnpm-workspace.yaml         # apps/*, packages/*
├── turbo.json                  # Turborepo task graph (build, dev, lint, clean)
├── tsconfig.base.json          # shared TS baseline (where referenced)
├── .npmrc                      # pnpm: hoisted + Expo/Metro friendliness
├── apps/
│   ├── mobile/                 # Expo app (npm name: labour-app)
│   │   ├── app/                # Expo Router routes, layouts, screens
│   │   ├── components/
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── app/context/
│   │   ├── assets/
│   │   ├── app.json
│   │   ├── metro.config.js     # monorepo: watchFolders + resolver for pnpm
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── backend/                # Node API (npm name: apna-rojgar-backend)
│       ├── index.js            # Express entry (ESM: "type": "module")
│       ├── app/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── middlewares/
│       │   ├── validations/
│       │   ├── utils/
│       │   ├── cron/
│       │   └── ...
│       └── package.json
└── packages/
    └── common/                 # @repo/common — shared TypeScript (build → dist/)
        ├── src/
        └── package.json
```

**Workspace package names (for `pnpm --filter`):**

| Directory | `package.json` name | Role |
|-----------|----------------------|------|
| `apps/mobile` | `labour-app` | Expo / React Native client |
| `apps/backend` | `apna-rojgar-backend` | Express API |
| `packages/common` | `@repo/common` | Shared types, constants, small pure helpers |

**Rules:**

- Work on **one workspace at a time** unless the task is explicitly cross-cutting (e.g. shared types in `@repo/common`).
- Mobile UI and routes live under **`apps/mobile/`** only; API code under **`apps/backend/`** only.
- Put **cross-app** shared code (types, enums, constants) in **`packages/common`** and import with `@repo/common`. After changing `packages/common`, run `pnpm --filter @repo/common build` (or rely on root `prepare` after `pnpm install`).

---

## 2. TOOLING & COMMANDS

Use **pnpm** from the **repo root** (Corepack can activate `pnpm@9.15.0` per root `package.json`).

| Goal | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Run all `dev` scripts (Turbo) | `pnpm dev` |
| Build everything (Turbo) | `pnpm run build` |
| Lint all (Turbo) | `pnpm run lint` |
| Dev API only | `pnpm --filter apna-rojgar-backend dev` |
| Dev Expo only | `pnpm --filter labour-app dev` |
| Build shared package | `pnpm --filter @repo/common build` |
| Mobile typecheck (strict TS) | `pnpm --filter labour-app typecheck` |

**Notes:**

- Root **`build`** runs Turbo; **`labour-app`**’s `build` is a lightweight no-op so the graph stays green; production mobile builds use **EAS** / native pipelines, not `tsc` at root.
- **`typecheck`** on mobile runs `tsc --noEmit` and may surface existing TS issues; it is optional for day-to-day dev.

---

## 3. MOBILE APP (`apps/mobile` — labour-app)

### Structure (high level)

- **`app/`** — Expo Router file-based routes (`_layout.tsx`, `(tabs)/`, `screens/`, etc.).
- **`components/`** — reusable UI.
- **`constants/`** — app constants and small helpers that stay cohesive.
- **`utils/`** — utilities, hooks (e.g. deep links, analytics).
- **`app/context/`** — React context (e.g. notifications).

### Naming

- **Routes**: follow Expo Router segment naming under `app/`.
- **Components**: `PascalCase.tsx`.
- **Hooks**: `useSomething.ts` / `useSomething.tsx`.
- **Types**: PascalCase.

### State & data

- Prefer local state unless multiple screens need it; use **`app/context/`** for cross-route shared state.
- Centralize API helpers (see `app/api/` patterns); avoid scattering raw `fetch` without a shared pattern.

### Routing & deep links

- Use Expo Router (`Link`, `router`, segments) inside `app/`.
- Deep link handling: prefer a hook in `utils/` wired from `app/_layout.tsx` (or the established entry).

### Monorepo / Metro

- **`metro.config.js`** extends the default Expo config and sets **`watchFolders`** to the repo root and **`resolver.disableHierarchicalLookup`** for pnpm. Do not remove without understanding Metro + workspace resolution.

---

## 4. BACKEND (`apps/backend` — apna-rojgar-backend)

- **Entry**: `index.js` loads env, mounts Express, registers routes under `/api/v1/...`.
- **Structure**: `app/routes` → `app/controllers` → `app/models` / `app/middlewares` / `app/validations` / `app/utils`.
- **Env**: uses `.env.local` (development) vs `.env.production` as wired in `index.js` — do not commit secrets.

---

## 5. SHARED PACKAGE (`packages/common`)

- TypeScript compiles to **`dist/`**; consumers import **`@repo/common`**.
- Add only **stable, portable** code (types, constants, validation) — no React or Node-only server internals unless you intentionally split entrypoints later.

---

## 6. NAMING CONVENTIONS (CODE STYLE)

- **Components**: PascalCase (`ServiceCard`, `Highlights`).
- **Hooks/helpers**: camelCase (`useDeepLinkHandler`, `formatPhoneNumber`).
- **Types**: PascalCase (`NotificationPayload`, `ServiceDetails`).

---

## 7. UI, NOTIFICATIONS, ERRORS

- Prefer small reusable components; screens orchestrate, components present.
- Notifications: keep listeners/state centralized (e.g. `NotificationContext`) — avoid duplicate listeners per screen.
- Surface user errors with the existing toast/snackbar/alert pattern; log unexpected errors at boundaries.

---

## 8. TESTING

- Follow any configured test runner per workspace.
- Keep pure helpers in `utils/` or `@repo/common` easy to test (deterministic, minimal side effects).

---

## 9. CONFIGURATION & SECRETS

- **Never commit secrets** (`.env`, keys, tokens).
- Mobile: Expo config in **`apps/mobile/app.json`**; env for client-side config as the project already does (e.g. `.env` in `apps/mobile` if used).
- Backend: env files as documented in backend code — not in git.

---

## 10. KEY RULES (KEEP THESE TRUE)

1. **This is a monorepo** — use paths under `apps/mobile`, `apps/backend`, and `packages/common`; do not assume a single flat app at repo root.
2. **Use `pnpm --filter <workspace-name>`** when running a single package’s scripts from the root.
3. **Do not rename** `labour-app` / `apna-rojgar-backend` / store identifiers in `app.json` unless the product owner requests it (Play Store / EAS / bundle IDs).
4. **Don’t hardcode secrets or base URLs** — use env and existing config patterns.
5. **Centralize side effects** (notifications, deep links) at app boundaries.
6. **Prefer small, focused changes** consistent with existing style.
