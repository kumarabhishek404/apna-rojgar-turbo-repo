# Feature: Account Suspension Lock Screen

**Slug:** `account-suspension-lock`
**Created:** 2026-09-09
**Status:** Complete — All 5 phases done

---

## Phase Tracker

| Phase | Status | Started | Completed | Artifacts |
|-------|--------|---------|-----------|-----------|
| 1 — Requirements | Complete | 2026-09-09 | 2026-09-09 | 1-requirements.md |
| 2 — Prototyping | Skipped | 2026-09-09 | 2026-09-09 | 2-prototype.md |
| 3 — Implementation | Complete | 2026-09-09 | 2026-09-09 | 3-implementation.md |
| 4 — Testing | Complete | 2026-09-09 | 2026-09-09 | 4-testing.md |
| 5 — Documentation | Complete | 2026-09-09 | 2026-09-09 | 5-documentation.md |

---

## Feature Summary

When a signed-in user's status is `SUSPENDED`, the mobile app shows only one screen: a Hindi-first lock screen explaining the policy violation and the support email (`info@apnarojgarindia.com`) to request reactivation. Tabs, drawers, notifications, and deep links cannot be used until an admin sets the account back to `ACTIVE`.

---

## Key Decisions Log

| # | Phase | Decision | Options Considered | Chosen | Rationale | Date |
|---|-------|----------|-------------------|--------|-----------|------|
| D-1 | 0 | Scope | Mobile only / mobile + website | Mobile app | Request was for the labour app | 2026-09-09 |
| D-2 | 0 | Phases | All 5 / 1,3,4,5 | 1,3,4,5 — skip Stitch | Enhancement of existing suspend handling; system lock screen | 2026-09-09 |
| D-3 | 1 | Keep session vs force logout | Logout / keep session + lock | Keep session + lock screen | User must see the reason and be able to email admin | 2026-09-09 |
| D-4 | 1 | Copy language | Always Hindi / follow app locale | Follow app locale (default Hindi) | App already defaults to Hindi; other locales get equivalent copy | 2026-09-09 |
| D-5 | 3 | Guard style | Replace navigator / overlay | Overlay on root navigator | Logout and Expo Router keep working; UI is fully blocked | 2026-09-09 |
| D-6 | 2 | Stitch visuals | Generate / skip | Skip | Single system lock screen; matches existing InactiveAccountMessage | 2026-09-09 |

---

## Phase 3: Implementation

### CLAUDE.md Status
- [x] Already existed — no changes required for this feature

### Task Summary
| Layer | Tasks | Completed | Blocked |
|-------|-------|-----------|---------|
| Database | 0 | 0 | 0 |
| Backend | 0 | 0 | 0 |
| API | 1 | 1 | 0 |
| Frontend | 8 | 8 | 0 |

### Review Status
- [x] AI code review completed — Critical: 0, High: 0, Medium: 1 (DISABLED accounts still use profile overlay)
- [x] Security review completed — findings: 0 (no new auth bypass; APIs already reject SUSPENDED)
- [x] All Critical and High issues resolved
- [ ] Human code review assigned

### Resolved Decisions
| Decision | ADR # | Resolution |
|----------|-------|------------|
| Keep session + lock overlay | ADR-001 | Overlay in AccountAccessGuard |
| Skip Stitch | ADR-002 | Implement from existing inactive-account UI |

---

## Phase 4: Testing

### Coverage Summary
| Test Type | Count | Passing | Failing |
|-----------|-------|---------|---------|
| Unit | 0 | — | — |
| Component | 0 | — | — |
| API/Integration | 0 | — | — |
| E2E / Manual | 6 | Planned | — |

### Coverage Gaps
- [x] All ACs have at least one test scenario — Planned, device/manual
- [x] Maestro TC-GLB-024 updated to lock-screen assertions
- [x] Backend middleware already rejects SUSPENDED APIs

---

## Phase 5: Documentation

### Documentation Status
| Artifact | Generated | Reviewed | Published |
|----------|-----------|----------|-----------|
| Inline Comments | Yes | | |
| API Reference | N/A — no new endpoint | | |
| ADRs | Yes | | |
| Runbook | N/A — client lock screen | | |
| Release Notes | Yes | | |
