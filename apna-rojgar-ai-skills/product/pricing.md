# APNA ROJGAR — PRICING

Verified from the product on 2026-09-27.

## What is free

Posting a work requirement is free.

Creating an account, applying for work, and browsing listings are not paid features. Do not describe them as paid.

## What is paid

Employers can pay to promote a posted requirement on Apna Rojgar’s official social pages and communities.

- Purpose code: `SERVICE_SOCIAL_PROMOTION`
- Payment provider: Cashfree
- Default amount in code and app metadata: **₹500**
- Metadata key: `payments.service_promotion_amount`
- The app reads this amount from the backend. If metadata is missing, the client fallback is also ₹500.

Source:

- `apps/backend/app/utils/appMetadata.service.js`
- Mobile and website promotion UI (`promotionAmount` default `500`)

## Rules

- Never say posting costs ₹99, ₹500, or any other amount.
- Never say promotion costs ₹99. That figure is not in the product.
- Say promotion is ₹500 only as the current default. If the founder changes metadata, use the new confirmed amount.
- Do not invent discounts, subscriptions, commissions, or revenue.
- Revenue is `[NEEDS CURRENT CONFIRMED VALUE]`.

The broader model is in `company/business-model.md`.
