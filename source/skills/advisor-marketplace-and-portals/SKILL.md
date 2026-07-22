---
name: advisor-marketplace-and-portals
description: Use this skill when a user wants advisor discovery, profiles, marketplace filters, or protected advisor and customer portals, including requests that imply role-specific journeys; not for a general customer account with no advisor marketplace behavior.
---

# Separate Marketplace and Portal Trust

1. Inspect advisor identity and profile ownership, public fields, verification state, search/filter data, auth roles, booking handoff, portal routes, audits, and tests.
2. Implement the smallest requested discovery or portal workflow. Keep public profile data distinct from protected account, schedule, earnings, customer, and operational data.
3. Enforce authorization on every server read and mutation; hiding UI is not access control. Reuse generated-site SSO/session/RBAC conventions and do not create a second identity system.
4. Do not invent credentials, ratings, availability, pricing, verification, or marketplace rank. Make incomplete and unverified states explicit.
5. Test anonymous, customer, advisor, and admin boundaries; direct URL access; cross-account identifiers; empty results; filters; and booking handoff.

Report roles exercised, authorization evidence, and unsupported moderation, payout, verification, or ranking behavior. Do not claim a profile is verified without authoritative state.
