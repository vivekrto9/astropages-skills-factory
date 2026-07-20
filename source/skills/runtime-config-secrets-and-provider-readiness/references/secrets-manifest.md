# Project Secrets Manifest Contract

Follow the target generated site's current `astropages/secrets.manifest.json` schema and existing Control Plane lifecycle; do not invent fields from memory. First inspect whether a key is reserved by the integration catalog. Catalog-managed reserved bindings must not appear in this manifest.

For each verified custom non-reserved runtime key:

- use the exact logical name consumed by server-only code;
- provide accurate user-facing setup metadata supported by the current schema;
- include `documentationUrl` only when it is an optional, validated HTTPS URL to relevant official vendor documentation;
- never include a value, ciphertext, default credential, example credential, or environment dump;
- keep code and manifest changes in the same exact commit.

The generated runtime must expose three honest structured states: setup required with no live call, ready according to server-authoritative presence metadata, and provider failure without credential detail. Builder Client owns the Project Secrets Setup card and link. Generated-domain code must not guess a dashboard route; it may consume a validated platform-provided URL only when that contract exists.
