---
name: customer-auth-accounts-and-privacy
description: Use when adding customer sign-in, sessions, profiles, protected account data, consent controls, export, or deletion behavior.
---

# Protect Customer Identity and Data

1. Inspect current session/auth provider, cookie settings, account schema, authorization helpers, CSRF/origin checks, privacy lifecycle, SSO boundaries, and tests. Confirm customer identity is distinct from generated-site admin identity.
2. Implement the smallest requested account flow by extending existing primitives. Never build custom password storage or expose tokens, cookies, secrets, private astrology data, or other-account records.
3. Enforce server-side ownership for every read and mutation. Use secure session rotation, expiry, logout, redirect validation, and recovery behavior supported by the existing contract.
4. Collect and retain only requested data. Implement export, consent, or deletion semantics only when their scope and downstream effects are defined; report incomplete cascades.
5. Test anonymous/authenticated transitions, CSRF, fixation, direct-object access, cross-account identifiers, logout, expiry, and privacy lifecycle outcomes.

Report security controls, test evidence, and identity-provider or deletion limitations. Do not claim compliance from UI controls alone.
