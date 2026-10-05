# Apna Rojgar Knowledge

This folder is the source of truth for Apna Rojgar brand, product, company, marketing, development, and support knowledge.

`SKILL.md` describes how an assistant should behave. The other markdown files describe what is true about Apna Rojgar.

## Folder structure

```text
apna-rojgar-ai-skills/
│
├── SKILL.md
├── README.md
├── KNOWLEDGE_INDEX.csv
│
├── brand/
│   ├── brand-guidelines.md
│   ├── logo.md
│   ├── colors.md
│   ├── typography.md
│   └── visual-style.md
│
├── product/
│   ├── product-overview.md
│   ├── features.md
│   ├── user-roles.md
│   ├── pricing.md
│   └── roadmap.md
│
├── marketing/
│   ├── messaging.md
│   ├── social-media.md
│   ├── reels.md
│   ├── campaigns.md
│   └── content-examples.md
│
├── company/
│   ├── company-overview.md
│   ├── mission.md
│   ├── founder.md
│   └── business-model.md
│
├── development/
│   ├── tech-stack.md
│   ├── architecture.md
│   ├── api.md
│   └── development-rules.md
│
└── support/
    ├── faq.md
    ├── customer-support.md
    └── quick-replies.md
```

Gemini accepts only `.md`, `.txt`, `.csv`, and `.py`. Do not put PNG, JPG, SVG, `.gitkeep`, or `.DS_Store` in this folder. Logo image paths are written in `brand/logo.md`.

This folder is only for Gemini Spark. `SKILL.md` is the Spark skill. The Gemini Gem for messages, images, and videos is the separate folder `apna-rojgar-gemini-gem`.

## Where to add new information

| Information | File |
| --- | --- |
| Brand name, personality, meaning | `brand/brand-guidelines.md` |
| Logo | `brand/logo.md` |
| Colors | `brand/colors.md` |
| Fonts and type size | `brand/typography.md` |
| Visual style, photography, screenshots | `brand/visual-style.md` |
| What the product is | `product/product-overview.md` |
| Features and workflows | `product/features.md` |
| Workers, employers, mediators, language | `product/user-roles.md` |
| Prices and monetization details | `product/pricing.md` |
| Planned work | `product/roadmap.md` |
| Messages and approved terms | `marketing/messaging.md` |
| Social platforms | `marketing/social-media.md` |
| Reels | `marketing/reels.md` |
| Campaigns | `marketing/campaigns.md` |
| Example copy and prompts | `marketing/content-examples.md` |
| Company identity, origin, links, verified numbers | `company/company-overview.md` |
| Mission | `company/mission.md` |
| Founder | `company/founder.md` |
| Business model | `company/business-model.md` |
| Technologies | `development/tech-stack.md` |
| Repository and app structure | `development/architecture.md` |
| Endpoints, env vars, deep links | `development/api.md` |
| Engineering rules | `development/development-rules.md` |
| Common questions | `support/faq.md` |
| Support tone and process | `support/customer-support.md` |
| Short replies | `support/quick-replies.md` |

If a fact is not confirmed yet, mark it `[NEEDS CONFIRMATION]` in the matching file. Do not store guesses as facts.

## Source of truth

When information conflicts:

1. Latest confirmed founder-provided information
2. Official Apna Rojgar documents and assets
3. Current product information
4. Reliable external information
5. Never guess

When a fact changes, update the relevant file and add a short entry to the changelog below. Do not keep old and new facts in the same file unless the historical difference is useful.

## Changelog

### 2026-09-27 — skill.md matches this folder

Changed:

- Skill name is `apna-rojgar-ai-skills`, matching this folder
- `SKILL.md` now lists the real files, including logo, splash, and instruction files
- Each task points at the file that holds the fact

### 2026-09-27 — Verified against the product

Changed:

- Corrected promotion price from an unconfirmed ₹99 to the live default of ₹500. Posting stays free.
- Added official logo, adaptive icon, splash, and notification icon under `assets/`
- Added `brand/typography.md` (system font on mobile, Arial on the website, Hindi size scale)
- Split marketing colors from in-app UI colors
- Added LinkedIn, Threads, WhatsApp community, support email, phone, and address
- Documented live roles, verification, city-as-district, official skills, Rojgar Saathi, and API prefixes
- Recorded the real stack: pnpm, Turborepo, Expo 54, Express, MongoDB, Next.js 16, Cashfree, Firebase

Source:

- Repository on 2026-09-27 (`apps/mobile`, `apps/backend`, `apps/website`)

### 2026-09-27 — Knowledge folders aligned to SKILL.md

Changed:

- Replaced the numbered knowledge folders with the structure in `SKILL.md`
- Split existing brand, product, audience, marketing, content, business, and technical notes into the new files

Reason:

- The knowledge pack should match the file layout the skill tells assistants to use

### 2026-09-27 — Initial knowledge pack

Initial verified milestone:

- 1000+ Google Play installs
- DAU 14

### Future entries

```text
### YYYY-MM-DD — Short title

Changed:
- ...

Reason:
- ...

Source:
- Founder confirmation / official asset / product update / other reliable source
```
