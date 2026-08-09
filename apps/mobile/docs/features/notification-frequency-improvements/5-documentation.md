# Operations

Notification policy defaults are documented in `apps/backend/.env.example`.

## Admin dashboard
The Notifications admin screen reports sent, pending, failed, opened, delivery rate, open rate, current opted-out users, and 24-hour send/suppression/opt-out totals. Failed records include the provider reason; queued records include their scheduled time.

## Tuning
Use environment variables to change quiet-hour boundaries, discovery cooldown/cap, and reminder cooldown/cap. Keep transactional caps disabled so booking, application, cancellation, and account changes remain immediate.

## Data retention
Notification records remain in the existing notification collection. Lightweight suppression and opt-out metrics expire automatically after 90 days.
