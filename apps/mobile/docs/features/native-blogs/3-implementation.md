# Native Rojgar Tips — Implementation

## Plan
| ID | Task | Status |
|----|------|--------|
| API-1 | `app/api/blogs.tsx` client for list/detail/engagement | Done |
| FE-1 | BlogCard, BlogHtmlBody, BlogEngagement | Done |
| FE-2 | List screen `/screens/rojgar-tips` | Done |
| FE-3 | Detail screen `/screens/rojgar-tips/[slug]` | Done |
| FE-4 | Rewire bridges + deep link helper | Done |
| FE-5 | Pending login return for like/comment | Done |
| FE-6 | i18n en/hi | Done |

## Notes
- Share uses website URL + `POST /blogs/:slug/share`
- HTML body rendered via auto-height WebView (no new dependency)
- No backend changes
