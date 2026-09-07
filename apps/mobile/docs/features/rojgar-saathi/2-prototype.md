# 2 — Prototype: Rojgar Saathi

**Approach:** 2 — Extend existing product (unified home + profile menu). Stitch skipped (D-2).

## Screen inventory

| ID | Screen | 8 states |
|----|--------|----------|
| S-1 | Rojgar Saathi conversation | Yes |

### S-1 layout
```
← Rojgar Saathi
👋 Namaste, {name}
{help line}

[ suggestion 1 ]
[ suggestion 2 ]
[ suggestion 3 ]
(optional 4th)

transcript / assistant bubbles

          🎙️
     {speak prompt}
[ type field ]
```

### 8 states
- **Default:** suggestions from engine; mic idle.
- **Loading:** skeleton chips while context APIs load.
- **Empty:** still 3 fallback chips (help / bookings / nearby) — never “no records”.
- **Success:** short assistant reply + optional speak; chips update.
- **Error:** network / STT / unknown copy from spec §23.
- **Validation:** confirm before POST_WORK navigation.
- **Permission:** mic denied → type instead.
- **Offline:** network copy; chips still tappable to retry.

Suggestions always `t(key)` in selected locale.

### Entry
Home hero (beside notifications) + Profile menu.
