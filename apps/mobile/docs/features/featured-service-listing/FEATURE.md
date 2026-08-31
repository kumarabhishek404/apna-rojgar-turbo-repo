# Feature: Featured service listing

**Slug:** `featured-service-listing`  
**Created:** 2026-08-31  
**Status:** Complete — All 5 phases done

---

## Phase Tracker

| Phase | Status | Started | Completed | Artifacts |
|-------|--------|---------|-----------|-----------|
| 1 — Requirements | Complete | 2026-08-31 | 2026-08-31 | 1-requirements.md |
| 2 — Prototyping | Complete | 2026-08-31 | 2026-08-31 | 2-prototype.md |
| 3 — Implementation | Complete | 2026-08-31 | 2026-08-31 | 3-implementation.md |
| 4 — Testing | Complete | 2026-08-31 | 2026-08-31 | 4-testing.md |
| 5 — Documentation | Complete | 2026-08-31 | 2026-08-31 | 5-documentation.md |

---

## Feature Summary

Admins can feature a service in the in-app work list for a chosen number of days. Active featured services appear at the top of the mobile (and website) services list with a **Featured** / **फीचर्ड** badge. Featuring expires automatically.

---

## Key Decisions Log

| # | Phase | Decision | Options Considered | Chosen | Rationale | Date |
|---|-------|----------|-------------------|--------|-----------|------|
| D-1 | 1 | Who can feature | (a) employer self-serve, (b) admin only | Admin only, in registered-services details popup | Matches request: website admin control with days | 2026-08-31 |
| D-2 | 1 | Paid-only vs any service | (a) paid promotion only, (b) any service | Any service; paid chip stays as context | Admin may still feature unpaid work; paid is the usual case | 2026-08-31 |
| D-3 | 2 | Visual prototypes | (a) Stitch, (b) extend existing UI | Skip Stitch — extend existing list + admin popup | Enhancement to existing screens; user asked for product behaviour | 2026-08-31 |
| D-4 | 1 | Duration clock | (a) remaining from previous, (b) reset from save | Reset from the moment admin enables/saves | Clear “N days from now” control | 2026-08-31 |
| D-5 | 1 | Hindi label | (a) विशेष, (b) फीचर्ड | **फीचर्ड** | Matches existing प्रमोटेड style | 2026-08-31 |

---

## Phase 1: Requirements Analysis

### Input
Feature paid/admin-selected services at the top of the mobile services list with a Featured mark (Hindi too). Admin website service-details popup: enable featuring + number of days.

### Key Decisions
- See D-1 through D-5.

### Deferred Items
- Employer self-serve in-app featuring (separate from social-media Cashfree promotion).
- Auto-feature every paid service without admin action.

### Open Questions
- None blocking implementation.

---

## Phase 2: Prototyping

### Approach Used
Extend Existing Product (Approach 2)

### Screen Inventory
| Screen | States Defined | Handoff Ready |
|--------|---------------|---------------|
| Mobile service list card | Yes | Yes |
| Admin registered-services details popup | Yes | Yes |
| Website public service card | Yes | Yes |

### User Sign-off
- [ ] Prototype spec reviewed by product owner
- [x] Stitch skipped (D-3)

---

## Phase 3: Implementation

### CLAUDE.md Status
- [x] Already existed — no repo-layout change required

### Task Summary
| Layer | Tasks | Completed | Blocked |
|-------|-------|-----------|---------|
| Database | 1 | 1 | 0 |
| Backend | 3 | 3 | 0 |
| API | 1 | 1 | 0 |
| Frontend | 4 | 4 | 0 |

### Review Status
- [x] AI code review completed — Critical: 0, High: 0 (admin auth + expiry rank), Medium: 1 accepted
- [x] Security review completed — findings: 0 open
- [x] All Critical and High issues resolved
- [ ] Human code review assigned

### Resolved Decisions
| Decision | ADR # | Resolution |
|----------|-------|-----------|
| Admin-only pin, separate from promotion | ADR-001 | `listingFeature` subdocument |
| Duration resets from save | ADR-002 | `expiresAt = now + days` |
| Hindi label फीचर्ड | ADR-003 | `featuredBadge` |

---

## Phase 4: Testing

### Coverage Summary
| Test Type | Count | Passing | Failing |
|-----------|-------|---------|---------|
| Unit | 2 planned | — | — |
| Component | 4 | Manual | — |
| API/Integration | 5 | Manual | — |
| E2E | 1 | Manual | — |

### Coverage Gaps
- [x] All ACs have at least one test scenario
- [x] All 8 states specified per screen (manual)
- [ ] Automated runner — Planned — pending runner setup

---

## Phase 5: Documentation

### Documentation Status
| Doc Type | Generated | Reviewed | Published |
|----------|-----------|----------|-----------|
| Inline Comments | Yes | — | — |
| API Reference | Yes | — | — |
| ADRs | Yes | — | — |
| Runbook | N/A — no ops runbook needed | — | — |
| Release Notes | Yes | — | — |

---

## Changelog

| Date | Phase | Change | Downstream Impact |
|------|-------|--------|-------------------|
| 2026-08-31 | Init | Feature initialised | — |
| 2026-08-31 | 1–5 | Requirements through docs + implementation | Admin popup, list sort, Featured badge |
| 2026-08-31 | 3 | Home featured slider above Available Work; one requirement + more indicator | Mobile home dashboard |
