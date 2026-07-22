---
name: service-catalog-booking-and-availability
description: Use this skill when a user wants services, schedules, capacity, availability, appointment selection, rescheduling, cancellation, or booking journeys, including requests that imply reservable time; not for product checkout with no appointment.
---

# Build Consistent Booking Flows

1. Inspect service data, duration and price authority, timezone handling, provider schedules, capacity rules, booking storage, notifications, payments, and tests. Confirm who owns availability.
2. Implement the smallest requested booking path with explicit service, participant, timezone, start/end, status, and validation. Re-check availability server-side before committing.
3. Prevent double booking with the target repository's transaction, uniqueness, or reservation convention. Define expiry, duplicate-submit, cancellation, reschedule, and concurrency behavior only within requested scope.
4. Keep customer data minimal and account-scoped. Missing provider configuration or unavailable slots must return honest actionable states, never placeholder confirmation.
5. Test timezone boundaries, stale slots, capacity, concurrency, retries, authorization, cancellation/reschedule rules, and responsive keyboard use.

Report availability authority, booking-state evidence, and any payment, calendar, or notification limitation. Do not claim confirmation until the authoritative write succeeds.
