# Native Rojgar Tips — Prototype (Approach 2: extend existing product)

Skip Stitch (D-1). Match existing mobile patterns: Colors.primary, CustomHeader, CustomText, FlatList pagination, Toast, Ionicons.

## Screens
| ID | Screen | Route |
|----|--------|-------|
| S-1 | Tips list | `/screens/rojgar-tips` |
| S-2 | Tip detail + engagement | `/screens/rojgar-tips/[slug]` |

## S-1 List — 8 states
Default search + cards · Loading skeletons · Empty message · Success list · Error retry · Validation n/a · Permission public · Offline error banner

## S-2 Detail — 8 states
Default article · Loading · Empty/404 · Success · Error retry · Comment validation min 2 chars · Auth: toast + login for like/comment · Offline soft fail

## Handoff
Cards show title, excerpt, date, cover, like/comment badges. Detail: cover contain, HTML body WebView, sticky-ish engagement toolbar, comments below.
