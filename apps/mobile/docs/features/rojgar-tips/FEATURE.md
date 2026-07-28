# Rojgar Tips — Website + In-App

## Status

| Phase | Status | Started | Completed |
|-------|--------|---------|----------|
| 1 — Requirements | Complete | 2026-07-28 | 2026-07-28 |
| 2 — Prototyping | Skipped (strategy provided) | — | — |
| 3 — Implementation | Complete | 2026-07-28 | 2026-07-28 |
| 4 — Testing | Pending | | |
| 5 — Documentation | Pending | | |

## Goal

Single blog source of truth on the **website**. Mobile app shows the same tips via **WebView**. External tip links prefer the **browser** (SEO). App Links only claim job/app paths.

## Key Decisions Log

| # | Phase | Question | Chosen | Rationale | Date |
|---|-------|----------|--------|-----------|------|
| 1 | 1 | App vs website blogs | Both: website primary, app WebView | SEO + retention, one CMS | 2026-07-28 |
| 2 | 1 | Duplicate native blog UI? | No | One database / one HTML | 2026-07-28 |
| 3 | 3 | Tip deep links open app? | No — narrow App Links; legacy → WebView | Share/SEO stay on web | 2026-07-28 |
