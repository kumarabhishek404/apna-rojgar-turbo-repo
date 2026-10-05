# APNA ROJGAR — COLORS

Verified from the product on 2026-09-27.

## Marketing palette

Use these three colors for posters, reels, ads, and social creatives.

| Role | Hex | Use |
| --- | --- | --- |
| Primary dark blue | `#22409A` | Backgrounds, logo field, headlines, primary buttons |
| Accent orange | `#FF9933` | One highlight, a key word, or a small CTA accent |
| White | `#FFFFFF` | Text on blue, clean backgrounds |

Rules:

- Blue is the dominant color.
- Orange is an accent, not a second background.
- Do not introduce extra brand colors in marketing.
- Write the blue as `#22409A`. The app code uses the same color in lowercase: `#22409a`.

## In-app colors

These are product UI tokens from `apps/mobile/constants/Colors.ts`. Use them when describing or mocking the real app. Do not replace them with the marketing orange.

| Token | Hex | Use |
| --- | --- | --- |
| primary / heading / primary button | `#22409a` | Brand blue |
| text | `#2C2C2C` | Body text |
| background | `#F5F5F5` | Screen background |
| secondary background / fourth | `#EAF0FF` | Soft blue chips and panels |
| white | `#FFFFFF` | Cards, secondary buttons |
| subheading | `#5A5A5A` | Secondary text |
| action | `#FF7A00` | In-app action orange |
| tertiary | `#fa6400` | Strong orange accent in the app |
| highlight | `#FFC107` | Highlight |
| warning | `#FF8C00` | Warning |
| success | `#4CAF50` | Success |
| error / danger | `#DC3545` | Errors and destructive actions |
| link | `#007BFF` | Links |
| input border | `#CCCCCC` | Inputs |
| placeholder | `#A0A0A0` | Placeholder and disabled |
| inactive tab icon | `#5F7BA8` | Unselected bottom tab |
| selected tab | white icon on `#22409a` | Selected bottom tab |

Website CSS also defines lighter blues for gradients only:

- `#4f6fd8`
- `#162b6b`
- `#8da2ff`

Those are website gradient stops, not extra logo colors.

Status chips in the admin users table:

- Active status: emerald on a light green background
- Role chip: blue text `#22409a` on `#eef3ff`
- Verification is not a table column. A blue verified tick appears beside the name only when verification is Completed.

## Splash and system UI

- Splash background: `#ffffff`
- Android system UI background: `#22409a`

Source: `apps/mobile/app.json`.
