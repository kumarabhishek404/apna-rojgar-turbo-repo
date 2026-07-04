# Manual-Only Test List

These scenarios **must stay manual** (or need test-build hooks before automation).

---

## Device & OS features

| ID area | Scenario | Reason |
|---------|----------|--------|
| Permissions | Camera deny / ask later | OS dialog variance |
| Permissions | Gallery permission | Same |
| Permissions | Location deny | Same |
| Permissions | Notification permission | Same |
| Biometric | Fingerprint / face unlock | Hardware |
| Push | FCM delivery & tap from killed state | Requires Google Play services |
| Camera | Selfie capture registration | No testID; camera UI |
| TTS / voice | Text-to-speech, voice-to-text | Audio hardware |

---

## Visual & design (module 90)

- Theme colors, typography scale
- Hindi font rendering / truncation
- Landscape layout
- Safe area on notched devices
- Touch target size audit (manual measurement)

---

## Infrastructure

| Scenario | Reason |
|----------|--------|
| Force update block | Requires mocked version API |
| OTA update | Expo Updates server |
| API 500 / 404 / timeout per screen | Needs proxy or mock server |
| True offline airplane mode | Emulator network toggle — partial only |

---

## Security & production

| Scenario | Reason |
|----------|--------|
| Dev OTP `000000` on production | Must never pass — manual security check |
| Real SMS OTP | Cannot automate cost/consent |

---

## Generated flows tagged `manual-review`

Regenerate list:

```bash
node -e "
const m=require('./apps/mobile/maestro/reports/flow-manifest.json');
m.filter(x=>x.automation==='manual-review').forEach(x=>console.log(x.testId, x.title));
"
```

Typical patterns: camera, biometric, push, OTA, force update, API injection, screenshot.

---

## When a manual test becomes automatable

1. Add `testID` to target element  
2. Add staging seed data (job id, user id)  
3. Add test-build bypass flag (photo, OTP)  
4. Move case from this list to `flows/` hand-crafted YAML
