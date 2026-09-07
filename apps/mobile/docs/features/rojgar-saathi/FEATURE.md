# Feature: Rojgar Saathi (AI Voice Assistant)

**Slug:** `rojgar-saathi`
**Created:** 2026-08-27
**Status:** Complete — All 5 phases done

---

## Phase Tracker

| Phase | Status | Started | Completed | Artifacts |
|-------|--------|---------|-----------|-----------|
| 1 — Requirements | Complete | 2026-08-27 | 2026-08-27 | 1-requirements.md |
| 2 — Prototyping | Complete | 2026-08-27 | 2026-08-27 | 2-prototype.md |
| 3 — Implementation | Complete | 2026-08-27 | 2026-08-27 | 3-implementation.md |
| 4 — Testing | Complete | 2026-08-27 | 2026-08-27 | 4-testing.md |
| 5 — Documentation | Complete | 2026-08-27 | 2026-08-27 | 5-documentation.md |

---

## Feature Summary

In-app voice-first assistant **Rojgar Saathi** for WORKER / EMPLOYER / MEDIATOR. Opening screen shows Namaste + 3–4 role- and data-aware suggestions in the **selected app language**, plus a dominant microphone. Intents map to existing Apna Rojgar APIs. No hallucinated jobs, bookings, or workers.

---

## Key Decisions Log

| # | Phase | Decision | Options Considered | Chosen | Rationale | Date |
|---|-------|----------|-------------------|--------|-----------|------|
| D-1 | 1 | Scope of first ship | Full 6-phase agent vs MVP | MVP: UI + suggestions + rule intents + existing APIs + TTS + STT when native module available | Spec §37: do not overengineer | 2026-08-27 |
| D-2 | 2 | Stitch visual prototypes | Generate via Stitch vs implement from ASCII spec | Skip Stitch | User supplied complete UI spec; suggestions must follow selected language | 2026-08-27 |
| D-3 | 3 | LLM vs rules | OpenAI/Gemini vs on-device Hindi/Hinglish rules | Rule-based intent + API tools | No LLM key in repo; never invent app data | 2026-08-27 |
| D-4 | 3 | Suggestion language | Detect speech vs app locale | App selected locale via `t()` | User: “suggestion should in the selected language” | 2026-08-27 |
| D-5 | 3 | Consequential actions | Navigate away vs complete in chat | Collect slots, confirm, then existing APIs in Saathi | User: booking, post work, and apply without leaving chat | 2026-08-27 |

---

## Phase 1: Requirements Analysis

### Input
User product prompt “Intelligent AI Voice Agent” + language constraint.

### Deferred Items
- Full LLM NLU, posting work entirely by voice, storing audio, suggestion A/B weights from analytics.

### Open Questions
- None blocking MVP.

---

## Changelog

| Date | Phase | Change | Downstream Impact |
|------|-------|--------|-------------------|
| 2026-08-27 | Init | Feature initialised; skip Stitch (D-2) | Implement from prototype spec |
