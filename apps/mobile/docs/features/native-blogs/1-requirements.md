# Native Rojgar Tips — Requirements (lean)

## Feature Summary
Mobile users read Rojgar Tips natively (list + detail) via the same backend blogs API as the website, with like, comment, and share.

## Functional Requirements
- **FR-1** List published tips with search + pagination
- **FR-2** Open tip detail by slug (cover, title, author, date, body)
- **FR-3** Show engagement counts; refresh likedByMe when authenticated
- **FR-4** Toggle like (auth required → login)
- **FR-5** List/post comments and one-level replies; edit/delete own comments
- **FR-6** Share: `POST .../share` + system share sheet with website URL
- **FR-7** Rewire Home CTA, Profile menu, deep links → native screens
- **FR-8** External share URLs remain `https://www.apnarojgarindia.com/rojgar-tips/...`

## User Stories
- **US-1 → FR-1** As a user I browse tips so I find advice without leaving the app
- **US-2 → FR-2** As a user I read a tip in-app so content feels native
- **US-3 → FR-4/5** As a logged-in user I like/comment so I engage with content
- **US-4 → FR-6** As a user I share a tip so others can open it on web/app

## API Contracts (existing)
Public base: `/api/v1/blogs`
- `GET /` list · `GET /:slug` detail · `GET /:slug/engagement` · `GET /:slug/comments`
- `POST /:slug/like` (auth) · `POST /:slug/share` · `POST /:slug/comments` (auth)
- `POST /:slug/comments/:id/replies` · `PATCH|DELETE .../comments/:id` (auth/owner)

## Architecture
Mobile-only FE: `app/api/blogs.tsx` + screens under `app/screens/rojgar-tips/` + `components/blogs/*`. No backend changes.
