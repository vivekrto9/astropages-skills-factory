---
name: transactional-notifications-and-templates
description: Use this skill when a user wants event-driven email, SMS, push, or in-app customer notifications and their templates, including reminders implied by booking or order events; not for static page messages or marketing analytics.
---

# Send Notifications from Real Events

1. Inspect domain events, current queue or send path, provider adapter, template ownership, locale support, consent distinctions, retry/idempotency behavior, and tests. Confirm the requested recipient and trigger.
2. Implement the smallest requested transactional message from an authoritative committed event, not a browser success state. Keep provider authentication server-side and personal data minimal.
3. Use stable template variables with explicit validation and safe escaping. Preserve governed editable copy where it exists; do not move release-owned content into ad hoc source strings.
4. Separate transactional necessity from marketing consent. Bound retries and deduplicate by event/message identity; record safe delivery state without logging content or credentials.
5. Test missing variables, localization fallback, duplicate events, provider failure, retry, opt-out rules where applicable, and sanitized rendering.

Report trigger, template, mocked versus live delivery evidence, and provider or receipt limitations. Do not claim delivery from queue acceptance alone.
