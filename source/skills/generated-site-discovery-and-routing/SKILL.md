---
name: generated-site-discovery-and-routing
description: Use when a generated AstroPages site must be inspected before changing a route, page, component, content binding, runtime path, or project-owned contract.
---

# Discover the Generated Site

Establish the target repository's real ownership boundaries before editing. Treat another template as evidence, never as the source of truth.

1. Read project instructions and inspect git status, manifest files, routes, components, content bindings, runtime configuration, migrations, tests, and package scripts relevant to the request.
2. Trace the requested page from route to layout, shared component, styles, editable-content source, server handler, and tests. Identify the smallest safe change surface. If an existing route, component, or server handler already provides the requested behavior, reuse or expose it instead of rebuilding it.
3. Preserve generated-site contracts: generic environment names, project/environment-scoped resources, EmDash ownership, SSO, callbacks, and read-only render behavior.
4. Reuse target-project conventions. Use the neutral base for reusable-core evidence and Pandit for behavior only; do not import another template's business routes or branding.
5. Stop and report a concrete ambiguity when route or content ownership cannot be proven. Do not create a parallel source of truth or a parallel editable-content collection for an existing feature.

Before implementation, state which files own the behavior and why. After implementation, confirm the diff stayed within that boundary.
