# APNA ROJGAR — TYPOGRAPHY

Verified from the product on 2026-09-27.

## Marketing and posters

- Prefer simple, highly readable type.
- Hindi and Hinglish copy must stay large enough for a phone screen.
- Do not use decorative, luxury, or condensed display fonts for worker-facing posters.
- Logo text is part of the logo asset. Do not retype “अपना रोज़गार” in a different font when the official logo is shown.

## Website

The live website body uses:

```css
font-family: Arial, Helvetica, sans-serif;
```

Source: `apps/website/app/globals.css`.

Theme tokens also mention Geist (`--font-geist-sans`, `--font-geist-mono`), but the body rule above is what users see. Do not describe the public site as using a custom brand font.

## Mobile app

The app does not ship a custom font file.

`CustomText` uses the React Native system font. Default text size is 16, then scaled by language:

| Locale | Multiplier |
| --- | --- |
| Hindi (`hi`) | 0.9 |
| English (`en`) | 0.8 |
| Marathi, Rajasthani, Gujarati, Bengali, Punjabi, Kashmiri, Urdu | 0.8 |
| Tamil, Telugu, Kannada, Malayalam | 0.7 |

Source: `apps/mobile/constants/functions.tsx` (`FONT_SIZE_MULTIPLIER`, `BASE_FONT_SIZE`).

Hindi is intentionally a little larger than English. Keep Hindi UI copy short so it still fits.

## Weights

- Names, prices, and primary buttons: semibold or bold.
- Supporting lines (email, join date, captions): regular or medium.
- Do not use ultra-light weights on blue backgrounds.

## What not to invent

Do not claim the brand uses Poppins, Inter, Nunito, Noto Sans, or any other named font unless a later product change adds that font file.
