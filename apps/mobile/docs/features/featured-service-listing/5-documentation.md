# Phase 5 — Documentation

**Feature:** Featured service listing  
**Date:** 2026-08-31

## API Reference Documentation

### PATCH `/api/v1/admin/services/:id/listing-feature`

Pin or unpin a work on the in-app services list.

- **Auth:** Bearer token, admin role
- **Params:** `id` — MongoDB service id
- **Body:**

```json
{ "enabled": true, "days": 7 }
```

`days` is required when `enabled` is `true` (integer 1–90). Ignored when disabling.

**200**

```json
{
  "success": true,
  "message": "Service featured on the work list",
  "data": {
    "listingFeature": {
      "enabled": true,
      "days": 7,
      "startsAt": "2026-08-31T04:00:00.000Z",
      "expiresAt": "2026-09-07T04:00:00.000Z",
      "featuredBy": "…"
    },
    "isActive": true
  }
}
```

| Status | When |
|--------|------|
| 400 | Invalid id, `enabled` not boolean, days out of range |
| 401 | Missing/invalid token |
| 403 | Not admin |
| 404 | Service not found |

`POST /api/v1/service/all` is unchanged. Response items may include `listingFeature`. Active featured items are sorted first.

## Architecture Decision Records

### ADR-001 — Admin-only listing pin, separate from social promotion

- **Context:** Paid social promotion already exists (`socialMediaPromotion`). Product asked for in-list featuring with admin duration control.
- **Decision:** New `listingFeature` subdocument; do not overload promotion.
- **Alternatives:** Auto-feature every PAID service; let employers buy in-app pin.
- **Consequences:** Admin must act; paid services are not featured until enabled.
- **Resolves:** D-1, D-2

### ADR-002 — Expiry from save time

- **Context:** Admin chooses “how many days”.
- **Decision:** `expiresAt = now + days` on each successful enable/save.
- **Alternative:** Add days onto remaining time.
- **Resolves:** D-4

### ADR-003 — Hindi copy “फीचर्ड”

- **Context:** Need a badge parallel to **प्रमोटेड**.
- **Decision:** Use **फीचर्ड** via `featuredBadge`.
- **Resolves:** D-5

## Release Notes

### What’s New

- Admins can feature a work on the app list for a set number of days from **Registered Services → View details**.
- Featured works show at the top of the services list with a **Featured** / **फीचर्ड** mark.
- Featuring stops on its own when the days run out.

### Tweet version

Admins can now pin a job to the top of the Apna Rojgar work list for a chosen number of days — marked Featured / फीचर्ड.
