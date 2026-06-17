# Cashfree service promotion payment

When an employer posts a new work requirement, they can optionally pay **₹100** to promote it on Apna Rojgar social media channels and groups.

## Setup required before testing

### 1. Backend (`apps/backend/.env.local`)

Created with placeholders — paste your **Cashfree sandbox** keys from [Merchant Dashboard → Developers → API Keys](https://merchant.cashfree.com/):

```env
CASHFREE_CLIENT_ID=your_sandbox_app_id
CASHFREE_CLIENT_SECRET=your_sandbox_secret_key
CASHFREE_ENV=sandbox
SERVICE_PROMOTION_AMOUNT=100
```

If testing against **Render dev** instead of local backend, add the same four variables in the Render service environment settings.

### 2. Mobile (`apps/mobile/.env`)

Already configured:

```env
EXPO_PUBLIC_CASHFREE_ENV=SANDBOX
EXPO_PUBLIC_BASE_URL="http://192.168.31.93:4000/api/v1"   # local backend
```

Switch `EXPO_PUBLIC_BASE_URL` back to the Render URL when not running the backend locally.

### 3. Native build (Android)

```bash
pnpm --filter labour-app exec expo prebuild --platform android
pnpm --filter labour-app android
```

`expo prebuild --platform android` has been run. iOS prebuild may fail due to an existing Firebase AppDelegate plugin issue — use Android for Cashfree testing first.

Register package `com.kumarabhishek404.labourapp` in Cashfree dashboard before production payments.

## Admin payments view (mobile)

Admin → Settings → **Promotion Payments** lists all social-media promotion payments with:

- Paid / collected amount / promoted works summary
- Filters: All, Paid, Pending, Failed
- Employer details, order ID, linked work (tap to open)

API: `GET /api/v1/admin/promotion-payments?status=PAID&page=1&limit=10`

## Cashfree webhook (server-side confirmation)

Configure in Cashfree dashboard:

```
POST https://<your-api-host>/api/v1/payments/webhook/cashfree
```

Events handled: payment success and failure. Signature is verified using HMAC-SHA256 with your client secret ([docs](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification)).

Optional local dev bypass (never in production):

```env
CASHFREE_WEBHOOK_SKIP_VERIFY=true
```

## Flow

1. Employer completes the add-service wizard and taps **Submit All Details** on the review step.
2. A popup offers:
   - **Promote on Social Media** (₹100 via Cashfree)
   - **Submit Without Promotion** (free)
3. If promotion is chosen, the app creates a Cashfree order on the backend, opens Cashfree checkout, verifies payment, then posts the service with `socialMediaPromotion.enabled = true`.

## Backend setup

Add to `apps/backend/.env.local` (or production env):

```env
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret
CASHFREE_ENV=sandbox
SERVICE_PROMOTION_AMOUNT=100
```

API endpoints (auth required):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/payments/promotion/config` | Promotion amount & environment |
| POST | `/api/v1/payments/promotion/create-order` | Create Cashfree order |
| POST | `/api/v1/payments/promotion/verify` | Verify order status after checkout |

Uses Cashfree PG API **v2023-08-01** ([docs](https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/overview)).

## Mobile setup

Add to `apps/mobile/.env`:

```env
EXPO_PUBLIC_CASHFREE_ENV=SANDBOX
```

The Cashfree React Native SDK requires a **development build** (not Expo Go):

```bash
pnpm --filter labour-app exec expo prebuild
pnpm --filter labour-app android   # or ios
```

Register your Android package / iOS bundle ID in the Cashfree merchant dashboard before production payments.

## Testing (sandbox)

**Important:** In Cashfree **sandbox**, real UPI IDs (e.g. `6397308499@ybl`) and QR scans with PhonePe/GPay **do not work**. Payments are simulated only.

### Option A — Test UPI (easiest on web checkout)

1. Open Cashfree checkout → **Pay by UPI ID** → **Add new UPI ID**.
2. Click **Use** next to **`testsuccess@gocash`** (or type it manually).
3. Click **Proceed to Pay** → payment should succeed.

For a failed payment test, use **`testfailure@gocash`**.

[Full test UPI list](https://www.cashfree.com/docs/api-reference/payments/data-to-test-integration)

### Option B — Test card

1. Choose **Cards** on the Cashfree page.
2. Card: `4706131211212123` · Expiry: `03/2028` · CVV: `123` · Name: `Test`
3. OTP: `111000`

### Option C — Mobile UPI intent (Android)

Install the [Cashfree UPI Intent Simulator APK](https://www.cashfree.com/docs/payments/online/mobile/misc/cashfree_upi_simulator_apk) on your device. In sandbox, tapping GPay/PhonePe opens the simulator instead of real apps.

### Verify integration

1. Configure sandbox credentials on the backend.
2. Complete a test payment using Option A or B above.
3. Confirm the created service has `socialMediaPromotion.status: PAID` in the database (or check **Paid Services** in website admin).
