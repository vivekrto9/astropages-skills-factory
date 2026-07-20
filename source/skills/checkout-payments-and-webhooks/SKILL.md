---
name: checkout-payments-and-webhooks
description: Use when implementing checkout, payment initiation, payment status, refunds, or verified payment webhooks in a generated site.
---

# Enforce the Payment Boundary

1. Inspect current provider contract, server adapter, secret resolver, order model, currency rules, webhook handling, idempotency storage, and tests. Confirm official authentication and event-verification behavior before coding.
2. Implement the smallest requested server-side payment flow. Calculate authoritative totals from current product data; never accept client-provided amount, customer identity, or success status. Credential values stay server-only.
3. Bind payment attempts to stable order and idempotency identifiers. Treat redirects as user experience only; update payment state from verified provider evidence.
4. Verify webhooks using exactly the official contract, preserve raw-body requirements, prevent replay, and make transitions idempotent. If authenticity cannot be proven, do not accept events.
5. Test tampered totals, missing configuration, duplicate initiation, forged/replayed events, out-of-order states, provider failure, and sanitized sandbox fixtures.

Report mocked, sandbox, and live evidence separately plus unresolved refund or settlement limitations. Never claim money moved without authorized observed verification.
