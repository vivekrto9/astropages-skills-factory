---
name: generated-admin-sso-rbac-and-audit
description: Use when changing generated-site admin SSO, privileged sessions, role checks, admin operations, or audit records.
---

# Secure Generated-Site Administration

1. Inspect the current Control Plane SSO exchange, callback validation, session cookies, role model, admin routes, mutation handlers, audit schema, and tests. Confirm this is generated-site admin—not platform release administration.
2. Implement the smallest requested privileged operation by reusing existing SSO and authorization helpers. Never create a bypass login, shared password, client-held token, or email-only authorization check. Credentials stay server-only.
3. Enforce role and project/environment scope server-side for every read and mutation. Validate redirect/state/nonce behavior and rotate or expire sessions according to the existing contract.
4. Audit real privileged changes with actor, action, target, outcome, and safe metadata; never log credential values, tokens, private payloads, or an audit record for a read-only render.
5. Test anonymous, expired, wrong-project, wrong-role, forged callback, CSRF/origin, successful mutation, and audit failure behavior.

Report roles exercised, security and audit evidence, and unresolved identity or operation limitations. Do not claim access is restricted from hidden UI alone.
