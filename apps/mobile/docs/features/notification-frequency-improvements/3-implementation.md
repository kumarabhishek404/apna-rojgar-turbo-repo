# Implementation

- Central policy: `apps/backend/app/utils/notificationPolicy.js`
- Delivery and queue processing: `apps/backend/app/controllers/notification.controller.js`
- Deferred queue schedule: every 15 minutes in `Asia/Kolkata`
- Persistent delivery state: priority, dedup key, schedule, attempts, tickets, failure, sent time, and open time
- Suppression metrics: 90-day records for cooldown duplicates, daily-cap blocks, and opt-outs
- Consent lifecycle: preference endpoint deactivates devices; logout deactivates authenticated user devices
- Shared mobile navigation: `apps/mobile/utils/notificationNavigation.ts`
- Foreground UI: mounted from `NotificationContext`
- Inbox navigation: tap-to-open with immediate read/open tracking
- Admin observability: delivery/open rates and 24-hour send, suppression, and opt-out metrics
