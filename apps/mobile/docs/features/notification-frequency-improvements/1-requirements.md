# Requirements

## Goal
Deliver timely, actionable notifications without duplicate discovery alerts or excessive reminders.

## Rules
- Transactional booking, application, team, account, and cancellation events send immediately.
- Discovery alerts respect 21:00–08:00 IST quiet hours, a 12-hour user/work cooldown, and a daily cap of 3.
- Pending-request reminders have a 6-day cooldown and profile reminders a 25-day cooldown.
- Reminder alerts respect quiet hours and a daily cap of 2.
- Notification consent and active device state must be synchronized with the backend.
- Push taps and inbox rows must open their related work when a service ID exists.
- Admins must be able to observe delivery, failures, opens, duplicate blocks, cap blocks, and opt-outs.
