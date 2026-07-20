---
name: d1-migrations-and-data-integrity
description: Use when changing generated-site D1 schema, constraints, indexes, persistence invariants, or data repair behavior.
---

# Evolve Generated-Site Data Safely

1. Inspect all existing generated-site migrations, schema checks, queries, bindings, seed/bootstrap paths, environment separation, rollback constraints, and tests. Confirm the exact data invariant the request needs.
2. Add the smallest forward-only migration using the repository's ordering and idempotency conventions. Never edit an applied migration or target Control Plane release tables from a generated site.
3. Preserve project-and-environment-scoped D1 resources and preview/production isolation. Add constraints or indexes only after checking existing data and query behavior.
4. Design backfill or repair work to be bounded, restartable, observable, and safe on partial failure. Do not place secrets or operational private data in rows or logs.
5. Test fresh schema, upgrade from the previous state, repeated application, constraint failures, query plans where material, and D1 schema-contract checks.

Report migration order, data assumptions, verification evidence, and any production backfill or rollback limitation. Do not claim deployed migration success from local tests.
