# Project Secrets Manifest Contract

Follow the target generated site's current `astropages/secrets.manifest.json` schema and existing Control Plane lifecycle; do not invent fields from memory. First inspect whether a key is reserved by the integration catalog. Catalog-managed reserved bindings must not appear in this manifest.

### Schema Template

`astropages/secrets.manifest.json` MUST strictly follow this exact JSON structure:

```json
{
  "version": 1,
  "integrations": [
    {
      "key": "provider_name",
      "name": "Human Readable Integration Name",
      "description": "Short summary of what this integration does",
      "documentationUrl": "https://official-vendor-docs.example.com/api-keys",
      "secrets": [
        {
          "key": "PROVIDER_API_KEY",
          "label": "Provider API Key",
          "helpText": "Clear description explaining where the user can find this key",
          "required": true,
          "environments": ["preview", "production"]
        }
      ]
    }
  ]
}
```

> [!CRITICAL]
> **Mandatory Schema Constraints**:
> 1. `version` MUST be `1`.
> 2. Top-level property MUST be `integrations` (an array of integration objects).
> 3. **NEVER** place a top-level `secrets` array directly under `version: 1`. Top-level `secrets` is unsupported and will cause schema validation failure (`manifest.secrets is unsupported`, `integrations must be an array`).
> 4. Each secret object inside `integrations[].secrets` MUST include:
>    * `key`: Uppercase letters, numbers, and underscores (e.g. `HUBSPOT_ACCESS_TOKEN`).
>    * `label`: User-facing title for the input field.
>    * `helpText`: Helpful instructions for obtaining the key.
>    * `required`: `true` or `false` boolean.
>    * `environments`: Array containing `["preview", "production"]`.

For each verified custom non-reserved runtime key:

- use the exact logical name consumed by server-only code;
- provide accurate user-facing setup metadata supported by the current schema;
- include `documentationUrl` only when it is an optional, validated HTTPS URL to relevant official vendor documentation;
- never include a value, ciphertext, default credential, example credential, or environment dump;
- keep code and manifest changes in the same exact commit.

The generated runtime must expose three honest structured states: setup required with no live call, ready according to server-authoritative presence metadata, and provider failure without credential detail. Builder Client owns the Project Secrets Setup card and link. Generated-domain code must not guess a dashboard route; it may consume a validated platform-provided URL only when that contract exists.

