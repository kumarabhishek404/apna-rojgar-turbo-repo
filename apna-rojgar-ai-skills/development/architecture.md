# APNA ROJGAR — ARCHITECTURE

Verified from the repository on 2026-09-27.

```text
apna-rojgar-turbo-repo/
├── apps/
│   ├── mobile/          Expo app (labour-app)
│   │   ├── app/         Expo Router screens
│   │   ├── components/
│   │   ├── constants/   Colors, roles, official skills
│   │   └── utils/
│   ├── backend/         Express API
│   │   └── app/
│   │       ├── routes/
│   │       ├── controllers/
│   │       ├── models/
│   │       ├── middlewares/
│   │       └── utils/
│   └── website/         Next.js
│       ├── app/
│       ├── components/
│       └── public/      logo.png
└── packages/
    └── common/          @repo/common
```

## How the pieces connect

- Mobile and website call the Express API.
- Shared types belong in `packages/common`, then `pnpm --filter @repo/common build`.
- Work on one workspace at a time unless the change is truly shared.
- Do not put secrets in git. Mobile, website, and backend each use their own env files.

## Distribution

- Android: Google Play, package `com.kumarabhishek404.labourapp`
- Website: https://apnarojgarindia.com and https://www.apnarojgarindia.com
- iOS project exists. App Store availability is `[NEEDS CONFIRMATION]`.

## Deep links

Scheme: `apnarojgar`

| Link | Opens |
| --- | --- |
| `apnarojgar://job/<id>` | Service / work detail |
| `https://apnarojgarindia.com/job/<id>` | Same work detail |
| `apnarojgar://app` | App home |
| `apnarojgar://screens/notifications` | Notifications |
| `apnarojgar://rojgar-tips` and `.../rojgar-tips/<slug>` | Rojgar Tips |

Share the branded app page https://apnarojgarindia.com/app instead of only the raw Play Store URL when a short public link is needed.

## Product rules that affect structure

- City filters use district from the address.
- Skill filters use the official `WORKERTYPES` list only.
- Verification is `Pending`, `Applied`, or `Completed`.
- Admin UI is allowed only when `/user/info` returns role `ADMIN`.
