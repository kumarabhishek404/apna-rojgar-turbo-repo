# Rojgar Tips — Implementation notes

## FE-1 → US dual strategy

- Website remains the only blog CMS / SEO surface.
- Mobile `screens/rojgar-tips` loads the same pages in a WebView (`?inApp=1`).
- Profile menu + home CTA open the tips list.
- Footer CTA **Find Similar Jobs** → Work tab.

## Deep links

- Android App Links narrowed to `/job`, `/screens/service`, `/app` (requires new native build).
- Legacy tip opens still rewrite via `+native-intent` / `+not-found` → WebView.

## Website growth

- `BlogAppInstallBanner` sticky CTA on tip detail; hidden when `inApp=1`.
