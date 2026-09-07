# Testing

## Automated
- `pnpm --filter apna-rojgar-backend test`
  - notification classification
  - urgent bypass behavior
  - IST quiet-hour deferral
  - daytime delivery window
  - IST day boundary
  - dedup key and service deep-link generation
- `pnpm --filter apna-rojgar-website exec tsc --noEmit`
- `pnpm --filter labour-app typecheck`

The mobile workspace currently has unrelated pre-existing TypeScript errors. Notification-related files pass editor diagnostics.

## Production checks
- Trigger the same matching-work event twice and verify `Duplicates blocked (24h)` increases.
- Trigger more than three discovery sends for one user and verify `Daily-cap blocks (24h)` increases.
- Trigger a discovery alert after 21:00 IST and verify it remains pending until the queue runs after 08:00 IST.
- Open a push and an inbox row; verify open count/rate changes.
- Disable notifications and log out; verify consent/device cleanup and opt-out metrics.
