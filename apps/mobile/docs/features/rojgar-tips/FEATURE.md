# Rojgar Tips — Website + In-App

## Goal

**Superseded (2026-08-05)** by `docs/features/native-blogs/` — mobile now uses native list/detail against `/api/v1/blogs`. Website remains SEO share target.

~~Single blog source of truth on the **website**. Mobile app shows the same tips via **WebView**.~~

## Status

| Phase | Status | Started | Completed |
|-------|--------|---------|----------|
| 1 — Requirements | Complete | 2026-07-28 | 2026-07-28 |
| 2 — Prototyping | Skipped (strategy provided) | — | — |
| 3 — Implementation | Superseded by native-blogs | 2026-07-28 | 2026-08-05 |
| 4 — Testing | — | | |
| 5 — Documentation | — | | |

## Key Decisions Log

| # | Phase | Question | Chosen | Rationale | Date |
|---|-------|----------|--------|-----------|------|
| 1 | 1 | App vs website blogs | Both: website primary, app WebView | SEO + retention, one CMS | 2026-07-28 |
| 2 | 1 | Duplicate native blog UI? | No | One database / one HTML | 2026-07-28 |
| 3 | 3 | Tip deep links open app? | No — narrow App Links; legacy → WebView | Share/SEO stay on web | 2026-07-28 |
