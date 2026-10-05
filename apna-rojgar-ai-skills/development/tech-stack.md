# APNA ROJGAR — TECH STACK

Verified from the repository on 2026-09-27. For code work, the repository overrides this file if they differ.

## Repository

- pnpm workspaces
- Turborepo
- Root package name: `apna-rojgar`
- Folder name: `apna-rojgar-turbo-repo`

| Workspace | Package name | Role |
| --- | --- | --- |
| `apps/mobile` | `labour-app` | Expo / React Native app |
| `apps/backend` | `apna-rojgar-backend` | Express API |
| `apps/website` | `apna-rojgar-website` | Next.js site and web app |
| `packages/common` | `@repo/common` | Shared TypeScript types and helpers |

Do not rename `labour-app`. The Play Store package stays `com.kumarabhishek404.labourapp`.

## Mobile

- React Native with Expo SDK 54
- Expo Router
- Hermes
- Jotai
- TanStack Query
- Firebase Authentication (`@react-native-firebase/auth`)
- Expo Notifications
- Cashfree (in-app payments plugin)
- Expo Location
- Expo Speech Recognition for Rojgar Saathi
- System font only. See `brand/typography.md`.

## Backend

- Node.js, ES modules (`"type": "module"`)
- Express 4
- MongoDB with Mongoose
- JWT auth
- Firebase Admin
- Cloudinary for media
- Cashfree payment records
- Expo Server SDK for push
- Joi validation
- node-cron for scheduled jobs

API prefix: `/api/v1`.

## Website

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Body font: Arial, Helvetica, sans-serif
- Cashfree JS for web promotion checkout
- Jotai

## What not to assume

Do not add a new library, database, or backend language unless it is already in these packages. Do not claim a custom brand font.
