# Admin - Apna Rojgar

Separate Expo app for admins. It uses the live API and database at `https://api.apnarojgarindia.com/api/v1`. It does not share a Metro port, bundle id, or `dev` script with the customer app, so `pnpm dev` does not start it.

Sign-in uses the same OTP login as the API and continues only when the account has admin access (`role: ADMIN` or `isAdmin`).

## Run on a phone (Expo Go)

Install Expo Go on the phone, then from the repo root:

```bash
pnpm dev:admin
```

The phone and the computer must be on the same Wi‑Fi. Scan the QR code in Expo Go. The app loads from this computer and reads and writes the live database.

Restart Metro after changing `apps/admin-mobile/.env`. A release install ignores a local or LAN API address and uses production.

## Install an APK that does not need this computer

From `apps/admin-mobile`, after `npx eas login`:

```bash
npx eas init
npx eas build --profile preview --platform android
```

`preview` builds an installable APK pointed at the live database. This is a separate Expo project from the customer app. Do not reuse the customer EAS project id.
