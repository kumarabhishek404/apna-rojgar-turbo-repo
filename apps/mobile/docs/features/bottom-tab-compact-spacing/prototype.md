# Bottom tab bar — compact vertical spacing (prototype)

## Goal

Reduce extra **top** and **bottom** whitespace inside the bottom navigation so tabs feel tighter and more content sits above the bar, without clipping labels or breaking safe areas.

## Where it lives

- `app/(tabs)/_layout.tsx` — `tabBarTopPad`, `TAB_BAR_CONTENT`, `tabBarBottomPad`, `TabButton` / `tabPill` styles.

## Prototype values (iteration 1)

| Constant / style | Before | After (prototype) |
|------------------|--------|-------------------|
| `tabBarTopPad` | 6 | 0 |
| `TAB_BAR_CONTENT` | 64 | 56 |
| `tabPill.minHeight` | 52 | 46 |
| `tabPill.paddingVertical` | 4 | 2 |
| `tabPill.gap` | 2 | 1 |

**Unchanged:** `tabBarBottomPad` still follows `useSafeAreaInsets().bottom` (and small Android fallback) so content clears the home indicator / gesture bar.

## Follow-up

- Validate on small devices and with long translated labels (2 lines).
- If anything feels cramped, bump `TAB_BAR_CONTENT` or `tabPill.minHeight` slightly (+4px).
