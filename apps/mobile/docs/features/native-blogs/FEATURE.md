# Feature: Native Rojgar Tips (Blogs)

**Slug:** `native-blogs`  
**Created:** 2026-08-05  
**Status:** Phase 3 — Complete (lean testing/docs deferred)

---

## Phase Tracker

| Phase | Status | Started | Completed | Artifacts |
|-------|--------|---------|-----------|-----------|
| 1 — Requirements | Complete | 2026-08-05 | 2026-08-05 | 1-requirements.md |
| 2 — Prototyping | Complete (lean / Approach 2) | 2026-08-05 | 2026-08-05 | 2-prototype.md |
| 3 — Implementation | Complete | 2026-08-05 | 2026-08-05 | 3-implementation.md |
| 4 — Testing | Deferred | — | — | 4-testing.md |
| 5 — Documentation | Deferred | — | — | 5-documentation.md |

---

## Feature Summary

Replace the in-app WebView for Rojgar Tips with native list + detail screens. Use the same public `/api/v1/blogs` API as the website. Support like, comment (with reply/edit/delete for own), and share. Website remains SEO source of truth for URLs shared externally.

---

## Key Decisions Log

| # | Phase | Decision | Options Considered | Chosen | Rationale | Date |
|---|-------|----------|-------------------|--------|-----------|------|
| D-1 | 0 | Delivery pace | Full pipeline / accel / docs-then-impl | Accelerate + skip Stitch | API + mobile UI patterns already exist | 2026-08-05 |
| D-2 | 0 | Auth for like/comment | Prompt login / hide write / block detail | Toast + navigate to login | Matches website stay-on-page login UX | 2026-08-05 |
| D-3 | 0 | Scope | Full native / list+share / web parity | Full native like+comment+share | User request | 2026-08-05 |
| D-4 | 1 | Article HTML | New HTML lib / WebView body | Auto-height WebView for HTML body | Avoid new native dep; app already has webview | 2026-08-05 |
| D-5 | 1 | Share target | App deep link / website URL | Website `/rojgar-tips/:slug` URL | SEO + works without app | 2026-08-05 |

---

## Phase 1: Requirements Analysis

### Input
Replace blogs WebView with native screens using website blogs API; like, comment, share.

### Deferred Items
- Nested comment threads UI beyond one reply level (API already one level)
- Offline caching of articles

### Open Questions
None blocking.

---

## Phase 3: Implementation

### CLAUDE.md Status
- [x] Already existed (monorepo root)

### Task Summary
| Layer | Tasks | Completed | Blocked |
|-------|-------|-----------|---------|
| Database | 0 | 0 | 0 |
| Backend | 0 | 0 | 0 |
| API | 1 | 1 | 0 |
| Frontend | 6 | 6 | 0 |
