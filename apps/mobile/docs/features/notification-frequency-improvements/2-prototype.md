# Prototype

## Delivery flow
1. Classify the notification as transactional, discovery, reminder, or system.
2. Apply category cooldown and daily-cap rules.
3. Add a service deep link to the payload when available.
4. Send urgent/transactional messages immediately.
5. Queue non-critical messages received during quiet hours for the next 08:00 IST window.
6. Show received foreground messages in an in-app banner.
7. Record an open when the banner, system notification, or inbox row is selected.

## Mobile interaction
- Foreground banner: title, concise message, dismiss action, and tap navigation.
- Inbox row: tap marks it read, records the open, and navigates using the same payload.
- Preference toggle: backend consent updates before local state changes.
