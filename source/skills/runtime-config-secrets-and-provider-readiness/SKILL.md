---
name: runtime-config-secrets-and-provider-readiness
description: Use this skill when a user wants an external provider that needs Project Secrets, setup guidance, or a safe missing-configuration state, including implicit readiness needs; not for obtaining, provisioning, or exposing credential values.
---

# Declare Secrets and Setup States

Use the existing Project Secrets boundary for custom unsupported-provider keys. The builder may know logical key names and server-authoritative presence/readiness status; it never reads or handles a secret value.

1. Classify each binding before editing: catalog-managed reserved bindings must not appear in the manifest; only verified custom non-reserved keys belong in `astropages/secrets.manifest.json` under [the manifest contract](references/secrets-manifest.md). The optional HTTPS `documentationUrl` must be validated, relevant, and official.
2. For those custom keys, land generated code and `astropages/secrets.manifest.json` in the same exact generated-repository commit. The Control Plane synchronizes that exact commit; do not create another metadata path.
3. Treat missing or unsynchronized custom keys as not ready. The generated runtime returns a safe structured readiness state and makes no live call. Builder Client owns the Setup card and its Project Secrets link, deriving both from server-authoritative readiness/manifest data or a validated platform-provided URL if that contract exists.
4. Keep the unavailable feature isolated: preserve unrelated pages and make the state actionable rather than failing the whole site.
5. Test missing, partially configured, ready, provider-failure, and stale-manifest states without credential fixtures. Never place a secret value in source, browser-delivered data, logs, chat, previews, tests, or analytics.

Do not hardcode a dashboard URL in generated code. Do not use README, local environment examples, chat, or a custom settings form as the credential setup surface.
