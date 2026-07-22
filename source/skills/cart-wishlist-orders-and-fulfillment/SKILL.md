---
name: cart-wishlist-orders-and-fulfillment
description: Use this skill when a user wants shoppers to save products, assemble purchases, track orders, or follow fulfillment states, including implied post-catalog commerce journeys; not for product merchandising or payment-provider mechanics alone.
---

# Preserve Commerce State Correctly

1. Inspect product identifiers, current persistence, customer sessions, pricing authority, order model, fulfillment transitions, server actions, and tests. Trace each requested state change end to end.
2. Implement the smallest requested workflow with server-authoritative price and availability revalidation. Never trust browser totals, customer identity, fulfillment state, or privileged mutations.
3. Make mutations idempotent where retries are possible. Bound quantities, preserve currency precision, and define behavior for removed products, stale carts, guest/account transitions, and concurrent updates.
4. Keep order history account-scoped and expose no operational, secret, or other-customer data. Delegate provider charging and payment webhooks to the payment skill.
5. Test empty/stale carts, quantity bounds, duplicate submissions, session changes, authorization, order transitions, and sanitized success paths.

Report implemented state transitions, verification evidence, and any payment, inventory, or fulfillment operation that remains external. Do not claim an order is paid or fulfilled from local UI state.
