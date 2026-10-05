# APNA ROJGAR — FEATURES

Confirmed from the repository on 2026-09-27. These are live product areas, not a future wishlist.

If a detail is missing here, mark it `[FEATURE STATUS NEEDS CONFIRMATION]`. Do not invent screens.

## Accounts and language

- Sign in with mobile OTP. Firebase Authentication is used on the app.
- Roles stored on the user: `WORKER`, `EMPLOYER`, `MEDIATOR`, `ADMIN`.
- Public roles people choose: worker, employer, mediator.
- The app supports multiple Indian languages. Hindi and English are the main ones. Font scaling also exists for Marathi, Rajasthani, Tamil, Gujarati, Bengali, Punjabi, Telugu, Kannada, Malayalam, Kashmiri, and Urdu.
- Website default language is Hindi, with an in-app language switch.

## Profiles, skills, and city

- Users have a profile, photo, mobile, optional email, skills, and address.
- Skills must come from the official catalog in `WORKTYPES` / `WORKERTYPES`. Do not invent job titles as if they are selectable skills.
- Official skill groups:
  - Farming
  - Shop work
  - Home maintenance
  - Construction
  - Animal work
  - Driver jobs
  - Factory jobs
  - Electrical and appliance repair
  - General labour
- In filters and admin, **city means district**, taken from the address. It is not a free-typed city name.

## Work requirements (called services in the product)

- An employer posts a work requirement. Posting is free.
- Workers discover requirements and apply.
- Employers can accept or reject applications, book workers, cancel, or complete a booking.
- A requirement can be promoted on social media for the paid amount in `product/pricing.md`.
- Listings can be filtered by city (district) and skill.

## Mediator / contractor

- A mediator builds a team and sends requests to workers.
- A mediator can apply to work with team members and manage bookings.
- Daily attendance can be marked for booked work.

## Trust

Verification statuses:

- `Pending` — default
- `Applied` — user has requested verification
- `Completed` — verified

A verified tick is shown beside the name only when status is `Completed`.

Do not say every user is verified. Do not say “100% verified” or “guaranteed work”.

Ratings and reviews exist for work and people.

## Discovery and content

- Home is role-aware: worker, employer, and mediator see different work and people tabs.
- Bottom tabs include Home, Work, and People. Labels change by role.
- Rojgar Tips are public articles on the website at `/rojgar-tips`.
- Rojgar Saathi is the in-app voice and chat helper. Users can speak to it. Do not describe it as a human support agent.

## Notifications and app updates

- Push notifications use Expo notifications.
- The app can prompt for updates.
- Deep links open a job/service, the app home, notifications, or a Rojgar Tip. See `development/api.md`.

## Website

- Marketing site and logged-in web app: https://apnarojgarindia.com
- Logged-in users can browse work, post requirements, and manage bookings on the web.
- Admins use the web admin area (`/admin/...`) for users, services, paid promotions, direct requests, error logs, analytics, notifications, and Rojgar Tips.
- The social icon rail (Instagram, Facebook, LinkedIn, YouTube, Threads, Play Store) is hidden on admin pages.

## Android and iOS

- Android is published on Google Play. Package: `com.kumarabhishek404.labourapp`.
- App version in `apps/mobile/app.json` on 2026-09-27: `1.3.6` (Android versionCode `47`).
- iOS is configured in the project (`com.kumarabhishek404.labourapp`). Do not claim an App Store release unless the founder confirms one.

## Admin-only behaviour

- Admin is a role, not a mobile number.
- Admin users table shows name, mobile, role, account status, source, and join time. Verification is the badge, not a column.
- Join time is relative when recent (`10 minutes ago`, `2 hours ago`, `1 day ago`) and a short date after a week (`11 Aug, 2026`).
