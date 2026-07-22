---
name: navigation-search-and-routing
description: Use this skill when a user wants public navigation, menus, breadcrumbs, route relationships, or on-site search, including discoverability problems that imply wayfinding changes; not for server API routing with no visitor navigation.
---

# Connect Routes and Search

1. Inspect route files, layouts, content collections, locale rules, existing navigation, redirects, and tests. Trace each requested destination to its real source of truth.
2. Implement the smallest requested route or navigation change with semantic links, accurate active state, keyboard operation, and mobile behavior. Do not create duplicate route registries.
3. For search, define the bounded searchable sources and public fields. Exclude drafts, private records, secrets, and operational data; keep indexing and result URLs consistent with locale and canonical-route rules.
4. Preserve EmDash content ownership and read-only public rendering. Use existing generated-site conventions and generic runtime configuration.
5. Test valid, missing, nested, localized, keyboard, empty-result, and stale-link behavior. Verify no private content enters the index.

Report changed route ownership, verification evidence, and any content type or search-quality limitation. Do not claim complete indexing without measuring the actual sources.
