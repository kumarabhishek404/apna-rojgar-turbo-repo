# Phase 1 — Requirements

**Feature:** Featured service listing  
**Date:** 2026-08-31

## Requirements Document

### Feature Summary

Admins can pin a work listing at the top of the in-app services list for a chosen number of days. While featuring is active, workers see that work first, with a **Featured** / **फीचर्ड** badge. Featuring expires automatically.

This is separate from Cashfree social-media promotion. Promotion is a paid social boost; listing feature is an admin pin on the in-app list.

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Admin can enable featuring for a specific service from the registered-services details popup. |
| FR-2 | Admin can set featuring duration in days (1–90), with presets 3 / 7 / 15 / 30. |
| FR-3 | Admin can turn featuring off. |
| FR-4 | Saving enable resets the clock from the save time (`expiresAt = now + days`). |
| FR-5 | Mobile services list shows active featured works at the top of each sort. |
| FR-6 | Featured works show a **Featured** badge (Hindi: **फीचर्ड**). |
| FR-7 | After `expiresAt`, the work is no longer treated as featured (no badge, no pin). |
| FR-8 | `GET /service/all` ranks active featured works first, then the requested sort. |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Only users with admin access can change featuring. |
| NFR-2 | Duration must be a whole number 1–90. |
| NFR-3 | Badge copy follows the active locale (`t()`), not bilingual on one line. |
| NFR-4 | Expired featuring must not stay pinned even if `enabled` was left true in old data — expiry date is authoritative together with `enabled`. |

### User Stories

See **User Stories** below.

### Edge Cases

- Featuring a cancelled/completed work: allowed; it only appears in lists that include that status.
- Multiple featured works: all active featured rank above non-featured; among featured, secondary sort applies.
- Changing days while already featured: clock restarts from save.
- Unpaid service: admin may still feature it (D-2).

## Gap Analysis

| Gap | Risk | Resolution |
|-----|------|------------|
| Auto-feature every paid service | Medium | Deferred — admin must opt in |
| Employer self-serve in-app pin | Low | Deferred — social promotion already exists |
| Notify employer when featured | Low | Deferred |
| Audit log of who featured | Low | `featuredBy` stored on the service |

## User Stories

### US-1 — Admin enables featuring (FR-1, FR-2, FR-4)

**As an** admin  
**I want** to feature a service for N days  
**So that** it appears at the top of the worker list.

**AC-1:** Given the details popup is open, when I enable featuring, pick days, and save, then the service is featured until now+N days.  
**AC-2:** Given invalid days, when I save, then the API returns 400 and the UI shows a validation message.

### US-2 — Admin disables featuring (FR-3)

**As an** admin  
**I want** to turn featuring off  
**So that** the work returns to normal list order.

**AC-3:** Given a featured service, when I uncheck Enable and save, then it is no longer pinned or badged.

### US-3 — Worker sees featured works first (FR-5, FR-6, FR-8)

**As a** worker  
**I want** featured jobs at the top with a clear badge  
**So that** I notice promoted/paid work first.

**AC-4:** Given at least one active featured hiring work, when I open the services list, then those cards appear before non-featured ones.  
**AC-5:** Given Hindi locale, when a featured card is shown, then the badge reads **फीचर्ड**.

### US-4 — Expiry (FR-7)

**As a** worker  
**I want** expired featuring to drop off automatically  
**So that** the list does not stay pinned forever.

**AC-6:** Given `expiresAt` is in the past, when the list is fetched, then the work is not ranked or badged as featured.

## Test Scenarios

| ID | Category | Title | Priority |
|----|----------|-------|----------|
| TS-1 | Positive | Admin features a service for 7 days | Critical |
| TS-2 | Positive | Featured service appears first in `/service/all` | Critical |
| TS-3 | Positive | Badge shows Featured / फीचर्ड | Critical |
| TS-4 | Positive | Admin disables featuring | High |
| TS-5 | Positive | Change days while featured resets expiry | High |
| TS-6 | Negative | Non-admin cannot PATCH listing-feature | Critical |
| TS-7 | Negative | days = 0 or 91 rejected | High |
| TS-8 | Negative | enabled not boolean → 400 | Medium |
| TS-9 | Edge | Expired featured not pinned | Critical |
| TS-10 | Edge | Several featured works all sit above others | High |
| TS-11 | Security | Unauthenticated PATCH → 401 | Critical |
| TS-12 | Performance | List query uses featured rank in the same aggregation | Medium |

## Architecture Inputs

### Data model

```
Service.listingFeature
  enabled: Boolean
  days: Number
  startsAt: Date
  starts clock on save
  expiresAt: Date
  featuredBy: ObjectId → User
```

Active when `enabled === true` AND `expiresAt > now`.

### API

| Method | Path | Auth | Body | Story |
|--------|------|------|------|-------|
| PATCH | `/api/v1/admin/services/:id/listing-feature` | Admin | `{ enabled: boolean, days?: number }` | US-1, US-2 |
| POST | `/api/v1/service/all` | User | existing filters | US-3, US-4 |

No new worker-facing endpoint. `listingFeature` is already on the service document returned by existing list/detail APIs.

### Workflow

```
Admin opens service details
  → Enable + days → Save
    → listingFeature.enabled=true, expiresAt=now+days
      → Worker list sorts featured first + badge
        → After expiresAt → treated as not featured
```
