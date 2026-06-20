# Screen Inventory — Apna Rojgar Mobile

Complete route and screen map for Maestro automation.  
**App version:** 1.3.1 · **Bundle:** `com.kumarabhishek404.labourapp`

---

## 1. App shell & global

| Screen | Route / trigger | Maestro module |
|--------|-----------------|----------------|
| App launch / splash | Cold start | `01 - App Launch` |
| Force update block | `useAppUpdateGuard` | `01 - App Launch` |
| No internet placeholder | `/screens/placeholders/noInternet` | `01 - App Launch` |
| Global side drawer | Jotai `SideDrawerAtom` | `24 - Attendance` / global |
| Global bottom drawer | Jotai `BottomDrawerAtom` | global |
| Exit confirmation | Hardware back on tab roots | `01 - App Launch` |
| Error boundary | Crash fallback | `01 - App Launch` |

---

## 2. Onboarding & language

| Screen | Route |
|--------|-------|
| Language selection | `/languageSelection` |
| User tips / onboarding | `/screens/userTipForAppUse` |
| Bottom nav tutorial | `/screens/tutorials/bootomNavigation` |
| Change language | `/screens/settings/changeLanguage` |

---

## 3. Authentication & registration

| Screen | Route |
|--------|-------|
| Login (OTP) | `/screens/auth/login` |
| Register step 1 — mobile | `/screens/auth/register/first` |
| Register step 2 — profile | `/screens/auth/register/second` |
| Register step 3 — PIN (legacy) | `/screens/auth/register/third` |
| Register step 4 — role/skills | `/screens/auth/register/fourth` |
| Register step 5 — photo | `/screens/auth/register/fifth` |
| Register wizard (alt) | `/screens/auth/register` |

---

## 4. Bottom tabs (authenticated)

| Tab | Route | Worker | Employer | Mediator | Admin |
|-----|-------|--------|----------|----------|-------|
| 1 | `/(tabs)/` | Home dashboard | Home | Home | Admin users |
| 2 | `/(tabs)/second` | Work (services) | Worker list | Worker list | Admin services |
| 3 | `/(tabs)/third` | Contractors | Contractors | Active works | People |
| 4 | `/(tabs)/fourth` | Activity | Activity | Activity | Admin requests |
| 5 | `/(tabs)/fifth` | Profile | Profile | Profile | Admin profile |

**Unified components:** `UnifiedHomeDashboard`, `UnifiedWorkScreen`, `UnifiedPeopleScreen`, `UnifiedActivityScreen`

---

## 5. Jobs / services

| Screen | Route |
|--------|-------|
| Service list (embedded) | Work tab |
| Service detail | `/screens/service/[id]` |
| Job deep link bridge | `/job/[id]` → service detail |
| Applicants | `/screens/service/applicants` |
| Selections | `/screens/service/selectedApplicants` |
| Applications summary | `/screens/service/applicantsSummary` |
| Service actions | `/screens/service/actionButtons` |

---

## 6. Post job wizard (employer)

| Step | Route |
|------|-------|
| Wizard host | `/screens/addService` |
| Category | `.../SelectWorkCategory` |
| Sub-category | `.../SelectWorkSubCategory` |
| Requirements / salary | `.../SelectWorkerSalary` |
| Facilities | `.../SelectFacilities` |
| Location & date | `.../SelectLocation&Date` |
| Duration & description | `.../SetDuration&Description` |
| Images | `.../UploadImagesStep` |
| Review | `.../final` |

---

## 7. People & users

| Screen | Route |
|--------|-------|
| User browse list | `/screens/users` |
| User profile | `/screens/users/[id]` |
| User actions drawer | `/screens/users/buttons` |
| Add booking details | `/screens/users/addBookingDetails` |
| Favourites | `/screens/favourite` |

---

## 8. Activity & bookings

| Screen | Route |
|--------|-------|
| Activity hub | `/(tabs)/fourth` + `?tab=` |
| Bookings list | `/screens/bookings` |
| Booking detail | `/screens/bookings/[id]` |
| Selected users | `/screens/bookings/selectedUsers` |
| Add attendance | `/screens/bookings/addAttendance` |
| Show attendance | `/screens/bookings/showAttendance` |
| Legacy booking tabs | `/screens/bottomTabs/bookingsAndRequests/*` |

---

## 9. Team / mediator

| Screen | Route |
|--------|-------|
| Team requests | `/screens/teamRequests` |
| Team detail | `/screens/team/[id]` |
| Team details view | `/screens/team/teamDetails` |

---

## 10. Profile & settings

| Screen | Route |
|--------|-------|
| Profile tab | `/(tabs)/fifth` |
| Full profile | `/screens/profile` |
| Delete account | `/screens/profile/deleteProfile` |
| Experience history | `/screens/experience` |
| Reviews | `/screens/reviews` |
| Add review | `/screens/reviews/addReview/[id]` |

---

## 11. Notifications

| Screen | Route |
|--------|-------|
| Notifications inbox | `/screens/notifications` |
| Push tap → deep link | `NotificationContext` |

---

## 12. Support & legal

| Screen | Route |
|--------|-------|
| Help / FAQ | `/screens/helps` |
| Support | `/screens/support` |
| App feedback | `/screens/appFeedback` |
| Privacy policy | `/screens/privacyPolicy` |
| Terms | `/screens/termsAndConditions` |
| Share app | `/screens/shareApp` |

---

## 13. Admin panel

| Screen | Route / tab |
|--------|-------------|
| Admin users | Tab 1 (admin) |
| Admin services | Tab 2 |
| Admin requests | Tab 4 |
| Admin profile | Tab 5 |
| Admin settings | `/screens/bottomTabs/(admin)/settings` |
| All feedback | `/screens/allFeedback` |
| Promotion payments | `/screens/admin/promotionPayments` |

---

## 14. Deep links

| URL | Destination |
|-----|-------------|
| `apnarojgar://job/{id}` | Service detail |
| `https://apnarojgarindia.com/job/{id}` | Service detail |
| `apnarojgar://screens/service/{id}` | Service detail |
| Push `type=JOB` + `id` | Job deep link |

---

## 15. Search & filters

| Screen | Route |
|--------|-------|
| Search services | `.../search/searchServices` |
| Search workers | `.../search/searchWorkers` |
| Filter services | `.../search/filterServices` |
| Filter workers | `.../search/filterWorkers` |
| All services list | `.../search/allServices` |
| All workers list | `.../search/allWorkers` |

---

**Total routable screens:** 80+ user-facing (+ legacy routes under `bottomTabs`)

**Maestro mapping:** Each row maps to a sheet in `flows/generated/{module}/` via `scripts/mobile-test-cases/screen-groups.js`.
