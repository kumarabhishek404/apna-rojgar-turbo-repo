# Phase 4 — Testing

**Feature:** Featured service listing  
**Date:** 2026-08-31

## Test Plan

Coverage is scenario-based. Backend/mobile do not have a dedicated listing-feature runner in this change.

### Coverage matrix

| AC | Tests | Types |
|----|-------|-------|
| AC-1 | TS-1, TS-5 | Positive |
| AC-2 | TS-7, TS-8 | Negative |
| AC-3 | TS-4 | Positive |
| AC-4 | TS-2, TS-10 | Positive |
| AC-5 | TS-3 | Positive |
| AC-6 | TS-9 | Edge |

No AC is [UNDER-COVERED].

### Manual QA (Critical path)

1. Admin → Registered Services → open a hiring work.
2. Enable featuring, choose 3 days, Save.
3. Confirm amber Featured chip on the row and in the popup; expiry shown.
4. On mobile (Hindi): Work tab services list — that card is first with **फीचर्ड**.
5. Switch to English: badge **Featured**.
6. Disable featuring, Save — card returns to normal order on refresh.
7. Enable with days=0 → validation error, no write.

### API checks

```bash
# Admin only
PATCH /api/v1/admin/services/:id/listing-feature
Authorization: Bearer <admin>
{ "enabled": true, "days": 7 }

# Worker list — featured first
POST /api/v1/service/all?status=ACTIVE&page=1&limit=10
{ "sortBy": "nearest" }
```

## Coverage Analysis

| Test type | Count | Notes |
|----------|-------|-------|
| Unit | 2 planned | `isListingFeatureActive`, `parseListingFeatureDays` — pending runner |
| Component | 4 | List default/empty; admin default/validation/error/success |
| API | 5 | 200 enable, 200 disable, 400 days, 401, 403 |
| E2E | 1 | Admin feature → mobile list (manual) |

### Coverage Gaps

- [x] All ACs have at least one test scenario
- [ ] Automated unit runner for listingFeature helpers — Planned — pending runner setup
- [ ] Maestro flow for featured badge — Planned
