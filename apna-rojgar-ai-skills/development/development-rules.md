# APNA ROJGAR — DEVELOPMENT RULES

Use the repository as the source of truth when it conflicts with this pack.

## Workspace

- This is a pnpm + Turborepo monorepo.
- Run one package with `pnpm --filter <package-name>`.
- Mobile UI stays in `apps/mobile`. API stays in `apps/backend`. Web stays in `apps/website`.
- Shared types go in `packages/common`.
- Do not rename `labour-app` or the Play Store package unless the founder asks.

## Product behaviour to preserve

- Posting a requirement is free. Promotion defaults to ₹500 via Cashfree.
- City means district.
- Skills come from the official catalog only.
- Verification badge appears only for `Completed`.
- Admin access is `role === ADMIN` from the API, never a hardcoded mobile number.
- Do not put the social icon rail on admin pages.
- Do not invent API endpoints, collections, env vars, or credentials.

## Accuracy

Separate current behaviour, a planned change, an idea, and a recommendation.

If this pack and the code disagree, follow the code and say which file you used.
