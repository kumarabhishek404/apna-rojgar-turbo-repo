# Phase 2 — Prototype

**Feature:** Featured service listing  
**Approach:** Extend existing product (Approach 2)  
**Stitch:** Skipped (D-3)

## Prototype Specification

### S-1 — Mobile services list card (`ListingServices`)

Featured works keep the existing card. Extra: gold **Featured** chip on the hero (bottom-left).

| State | Spec |
|-------|------|
| Default | Featured card at top of list; star + `t("featuredBadge")`. |
| Loading | Unchanged list skeleton. |
| Empty | Unchanged empty state when no works. |
| Success | Order from API; no extra toast. |
| Error | Unchanged list error. |
| Validation | N/A on list. |
| Permission | Any signed-in role that can open the list. |
| Offline | Cached cards still show badge if `listingFeature` is on the cached item. |

### S-2 — Admin registered-services details popup

Amber **Feature on work list** panel at the top of the existing details modal.

- Checkbox: Enable featuring
- Day presets: 3, 7, 15, 30 + numeric input
- Save featuring
- If currently featured: chip + expiry timestamp

| State | Spec |
|-------|------|
| Default | Checkbox matches active featuring; days default 7 or last saved days. |
| Loading | Save button shows Saving…. |
| Empty | N/A. |
| Success | Green inline message; header chip updates. |
| Error | Red inline message from API. |
| Validation | Days 1–90 integer; message `listingFeatureDaysInvalid`. |
| Permission | Page already gated by `useAdminAccess`. |
| Offline | Fetch/save fail with existing request-failed copy. |

### S-3 — Website public service card

Same Featured chip on the image (bottom-left) when `isListingFeatureActive`.

## Developer Handoff Package

- **List order:** backend `listingFeatureRank` then existing sort; in-memory sorts must keep featured first after distance filtering.
- **Badge:** `featuredBadge` → EN Featured, HI फीचर्ड.
- **Admin write:** `PATCH /admin/services/:id/listing-feature`.
- **Do not** reuse `socialMediaPromotion` for this pin.

## Stitch Prompts

Skipped — recorded as D-3.
