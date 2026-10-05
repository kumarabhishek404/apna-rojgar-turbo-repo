# APNA ROJGAR — API

Verified from `apps/backend/index.js` on 2026-09-27.

Base path: `/api/v1`

| Prefix | Area |
| --- | --- |
| `/api/v1/auth` | Login and OTP |
| `/api/v1/user` | Profile, skills, verification, user lists |
| `/api/v1/employer` | Post and manage work requirements |
| `/api/v1/worker` | Worker actions |
| `/api/v1/service` | Service / requirement reads |
| `/api/v1/mediator` | Teams and mediator bookings |
| `/api/v1/booking` | Bookings |
| `/api/v1/employer/attendance` | Daily attendance |
| `/api/v1/review` | Ratings and reviews |
| `/api/v1/notification` | Notifications |
| `/api/v1/payments` | Cashfree promotion payments |
| `/api/v1/saathi` | Rojgar Saathi |
| `/api/v1/blogs` | Public Rojgar Tips |
| `/api/v1/admin` | Admin tools |
| `/api/v1/admin/blogs` | Admin Rojgar Tips |
| `/api/v1/feedback` | App feedback |
| `/api/v1/home` | Home payloads |
| `/api/v1/analytics` | Analytics |
| `/api/v1/appVersion` | App version check |
| `/api/v1/errors` | Error logs |
| `/api/v1/userProblem` | User problem reports |

Do not invent extra endpoints. Read the route file before naming a path, method, or body field.

## Environment examples already used by the app

Mobile public config can include:

- `EXPO_PUBLIC_BASE_URL`
- `EXPO_API_KEY_2_FACTOR`
- `EXPO_PUBLIC_SKIP_OTP`

Never print real keys, tokens, or production secrets. Never commit `.env` files.

## Deep links

See `development/architecture.md`.

## Payments metadata

- Key: `payments.service_promotion_amount`
- Default: `500` (INR)
- Purpose: `SERVICE_SOCIAL_PROMOTION`
