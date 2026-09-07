# Phase 3 — Implementation

**Feature:** Featured service listing  
**Date:** 2026-08-31

## Implementation Plan

| ID | Layer | File | Implements | Depends |
|----|-------|------|------------|---------|
| DB-1 | DB | `apps/backend/app/models/service.model.js` | US-1 | — |
| BE-1 | BE | `apps/backend/app/utils/listingFeature.js` | FR-7 helper | DB-1 |
| BE-2 | BE | `apps/backend/app/controllers/admin.controller.js` | US-1, US-2 | DB-1 |
| API-1 | API | `apps/backend/app/routes/admin.route.js` | US-1 | BE-2 |
| BE-3 | BE | `apps/backend/app/controllers/service.controller.js` | US-3, US-4 | BE-1 |
| FE-1 | FE | `apps/website/.../registered-services/page.tsx` | US-1, US-2 | API-1 |
| FE-2 | FE | `apps/mobile/components/commons/ListingServices.tsx` | US-3 | BE-3 |
| FE-3 | FE | `apps/website/components/services/ServiceCard.tsx` | US-3 | BE-3 |
| FE-4 | FE | locale JSON (en/hi, mobile + website) | US-3 AC-5 | — |

## Code Review Findings

| Severity | Finding | Status |
|----------|---------|--------|
| High | Admin route must use `checkAdmin` | Fixed — middleware on PATCH |
| High | Expired `enabled: true` must not rank first | Fixed — rank uses `expiresAt > now` |
| Medium | Pagination + nearest is still approximate (pre-existing distance filter after skip) | Accepted — featured rank is applied before skip |
| Low | `featuredBy` not populated in admin list | Accepted |

## Security Review Findings

| Finding | Status |
|---------|--------|
| PATCH is admin-only | Resolved |
| `days` bounded 1–90 | Resolved |
| No secrets in listingFeature payload | Resolved |

## Notes

- Featuring is not limited to paid services; paid chip remains independent.
- Website public list uses the same `/service/all` ranking, so featured works also appear first there.
