# Recommended testIDs — Apna Rojgar Mobile

Maestro prefers `id:` selectors. This document lists **implemented** testIDs and **recommended** additions.

---

## Implemented (this PR)

| Screen | Element | testID | File |
|--------|---------|--------|------|
| Login | Mobile input | `login-mobile-input` | `app/screens/auth/login.tsx` |
| Login | OTP input | `login-otp-input` | `app/screens/auth/login.tsx` |
| Login | Submit button | `login-submit-button` | `app/screens/auth/login.tsx` |
| Tabs | Home | `tab-home` | `app/(tabs)/_layout.tsx` |
| Tabs | Work | `tab-work` | `app/(tabs)/_layout.tsx` |
| Tabs | People | `tab-people` | `app/(tabs)/_layout.tsx` |
| Tabs | Activity | `tab-activity` | `app/(tabs)/_layout.tsx` |
| Tabs | Profile | `tab-profile` | `app/(tabs)/_layout.tsx` |
| Exit modal | Cancel | `exit-modal-cancel` | `components/commons/ExitPopup.tsx` |
| Exit modal | Confirm | `exit-modal-confirm` | `components/commons/ExitPopup.tsx` |
| Profile | Settings tab | `profile-tab-settings` | `app/screens/bottomTabs/(user)/profile.tsx` |
| Profile | Log out | `profile-logout-button` | `components/commons/ProfileMenu.tsx` |

---

## High priority (add next)

| Screen | Element | Current selector | Recommended testID | Reason |
|--------|---------|------------------|------------------|--------|
| Login | Change language | Text "Change Language" | `login-change-language` | i18n-safe navigation |
| Register step 1 | Mobile input | Placeholder text | `register-mobile-input` | Registration E2E |
| Register step 1 | Send OTP | Button text | `register-send-otp` | OTP flow |
| Register step 2 | Name field | Label `name` | `register-name-input` | Validation tests |
| Register step 2 | Address field | Label `address` | `register-address-input` | Required field |
| Register step 4 | Role picker | Picker | `register-role-picker` | Role-based routing |
| Home | Notifications icon | `accessibilityLabel` notifications | `home-notifications-button` | Already has a11y label |
| Home | Hero CTA | Text varies | `home-hero-cta` | Dashboard navigation |
| Work | Search toolbar | Icon | `work-search-button` | Search flows |
| Work | Filter button | `accessibilityLabel` filter | `work-filter-button` | Filter modal |
| Work | Service card | `accessibilityLabel` viewDetails | `work-service-card-{id}` | List stability |
| Service detail | Share | `accessibilityLabel` shareService | `service-share-button` | Share deep link |
| Service detail | Apply button | Text varies by role | `service-apply-button` | Worker E2E |
| Service detail | Cancel apply | Text | `service-cancel-apply-button` | Activity sync |
| Add service | FAB | UnifiedTabFab label | `fab-add-service` | Employer wizard entry |
| Add service | Next step | Button | `add-service-next` | Wizard navigation |
| Add service | Publish | Button | `add-service-publish` | Job creation |
| Profile | Log out | Text `Log Out` | `profile-logout-button` | Logout helper |
| Profile | Edit profile | Menu item | `profile-edit-button` | Profile E2E |
| Notifications | List item | Row | `notification-item-{id}` | Tap navigation |
| Activity | Sub-tab | SegmentedControl | `activity-tab-{index}` | Role sub-tabs |
| Admin users | Suspend | Action | `admin-user-suspend` | Admin flows |
| Loader | Full screen | `Loader` component | `global-loader` | Wait strategies |

---

## Medium priority

| Screen | Element | Recommended testID |
|--------|---------|-------------------|
| Filter services | Apply filters | `filter-services-apply` |
| Filter workers | Apply filters | `filter-workers-apply` |
| Booking detail | Confirm action | `booking-confirm` |
| Team request | Accept | `team-request-accept` |
| Review form | Submit | `review-submit` |
| Delete account | Confirm | `delete-account-confirm` |
| Language list | Hindi row | `language-hindi` |
| Language list | English row | `language-english` |

---

## Existing accessibilityLabel (use until testID added)

| File | Label key | English value |
|------|-----------|---------------|
| `ListingServices.tsx` | viewDetails | View Details |
| `ListingSearchToolbar.tsx` | filter | Filter |
| `HomeHeroSection.tsx` | notifications | Notifications |
| `service/[id].tsx` | shareService | Share |
| `UnifiedTabFab.tsx` | dynamic | FAB label |

Maestro can use: `tapOn: "View Details"` or `tapOn: { text: "Filter" }` — fragile when locale changes.

---

## Naming convention

```
{screen}-{component}-{action}
```

Examples: `login-mobile-input`, `service-apply-button`, `tab-home`

Use kebab-case. For lists, append `-${id}` only if stable in test builds.
