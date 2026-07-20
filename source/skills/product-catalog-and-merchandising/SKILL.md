---
name: product-catalog-and-merchandising
description: Use when adding or changing products, collections, product detail pages, pricing presentation, filters, or merchandising structures.
---

# Build a Truthful Product Catalog

1. Inspect product schema, content or data ownership, routes, currency formatting, media, inventory semantics, cart handoff, admin/edit flows, migrations, and tests. Confirm which fields are authoritative.
2. Implement the smallest requested catalog surface using existing models and components. Preserve stable product identifiers and do not duplicate prices or stock into presentation-only files.
3. Present price, variants, availability, tax or shipping qualifiers, and calls to action only when supported by real data. Never invent discounts, reviews, urgency, inventory, or fulfillment promises.
4. Keep editable merchandising content in its current governed path and public rendering read-only. Delegate checkout and payment state to their owning skills.
5. Test missing/invalid products, variants, currencies, unavailable items, filtering, responsive media, and cart handoff. Verify structured metadata matches visible content.

Report data ownership, supported catalog states, verification evidence, and inventory or pricing limitations.
