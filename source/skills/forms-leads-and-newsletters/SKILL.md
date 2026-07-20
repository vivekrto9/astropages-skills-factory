---
name: forms-leads-and-newsletters
description: Use when building or changing contact, lead-capture, inquiry, signup, or newsletter forms in a generated site.
---

# Build Honest Lead Forms

1. Inspect existing form components, server actions, validation, storage, consent copy, spam and origin defenses, provider adapters, privacy behavior, and tests. Confirm the exact requested fields and destination.
2. Implement the smallest usable form with semantic labels, clear required state, server-side validation, bounded inputs, accessible errors, duplicate-submit protection, and honest success/failure states.
3. Collect only fields needed for the stated purpose. Reuse existing consent, retention, deletion, rate-limit, and abuse controls; do not invent policies or quietly add marketing consent.
4. Keep vendor authentication server-side and delegate unknown provider contracts to the integration skills. Missing configuration must make no live call and return structured readiness.
5. Test invalid input, keyboard submission, abuse controls, duplicate submission, missing configuration, provider failure, and a sanitized success fixture.

Report the real storage or delivery path, mocked versus live evidence, and unresolved consent or provider limitations. Never claim a lead was delivered without observed confirmation.
