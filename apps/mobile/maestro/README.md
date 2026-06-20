# Apna Rojgar — Maestro Mobile Test Automation

Production Maestro framework for **labour-app** (Expo / React Native).

## Ready to test (5 minutes)

### 1. Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### 2. Build & install the app on emulator/device

```bash
# From repo root — debug APK on connected emulator
pnpm --filter labour-app android
# Or install a staging APK:
adb install -r path/to/your-build.apk
```

### 3. Configure test accounts

```bash
cd apps/mobile/maestro
cp .env.example .env
# Edit .env — set WORKER_MOBILE (and others for regression)
```

Use **staging** accounts with complete profiles (name, address, age, gender).  
OTP on staging/dev: **`000000`** (see `apps/mobile/utils/devOtp.ts`).

### 4. Preflight check

```bash
# From apps/mobile
pnpm test:maestro:check
```

Checks: Maestro installed, `.env` set, device connected, app installed.

### 5. Run smoke tests

```bash
pnpm test:maestro:smoke
```

Runs: login → all 5 tabs visible → logout.  
Report: `maestro/reports/maestro-smoke-junit.xml`

### 6. Run regression (optional)

```bash
pnpm test:maestro:regression
```

Requires `WORKER_MOBILE`, `EMPLOYER_MOBILE`, `MEDIATOR_MOBILE` in `.env`.

---

## Folder structure

```
maestro/
├── config.yaml           # Default appId + env
├── .env.example          # Copy to .env (gitignored)
├── scripts/
│   ├── check-ready.sh    # Preflight
│   ├── run-smoke.sh      # Smoke runner
│   └── run-regression.sh
├── flows/helpers/        # login, logout, tab taps
├── flows/generated/      # 665 flows (regenerate)
├── smoke/                # smoke-suite.yaml
├── regression/
├── worker/ employer/ mediator/ admin/
└── docs/
```

## Regenerate flows

When manual test modules change:

```bash
pnpm generate:maestro-flows
```

## testIDs (for stable selectors)

| testID | Screen |
|--------|--------|
| `login-mobile-input` | Login |
| `login-otp-input` | Login OTP step |
| `login-submit-button` | Login / Send OTP |
| `tab-home` … `tab-profile` | Bottom tabs |
| `profile-tab-settings` | Profile → Settings tab |
| `profile-logout-button` | Log out |
| `exit-modal-cancel` | Exit app dialog |

See `docs/screen-name-testids.md` for full list.

## CI

`.github/workflows/maestro-mobile.yml` — set secrets:

- `MAESTRO_ANDROID_APK_URL`
- `MAESTRO_WORKER_MOBILE`, `MAESTRO_EMPLOYER_MOBILE`, etc.

## App ID

`com.kumarabhishek404.labourapp`
