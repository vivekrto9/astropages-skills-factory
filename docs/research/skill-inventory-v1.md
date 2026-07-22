# Builder Skills v1 Inventory Proposal

Status: `milestone-1-proposal`

Date: 2026-07-20

## Purpose and taxonomy

This Milestone 1 inventory proposes the public browsing and explicit-selection surface for Builder Skills v1. It is research input for later schemas and skill packages; it is not a runtime catalog, a bundle, or an implementation claim.

The inventory preserves the architecture's three layers. The 11 ordered public categories are navigation aids. The 90 granular public intents are stable user-selectable shortcuts expressed as lowercase hyphen keys. The 29 internal skills are private, cohesive implementation packages and every internal record is explicitly `public: false`. Client experiences may expose categories and granular intents, but must not enumerate internal skill names.

The exact category order is:

1. Website Design
2. Content & Languages
3. Assets & Media
4. SEO & Discoverability
5. Marketing & Analytics
6. Store & Orders
7. Services & Bookings
8. Astrology Experiences
9. Customer Accounts
10. Integrations & Automation
11. Fix & Improve

The machine-readable proposal is `docs/research/skill-inventory-v1.json`. Its category, intent, evidence-family, and internal-skill arrays are deliberately ordered for deterministic review. Aliases are searchable Builder-picker metadata, not a Control Plane or AI routing mechanism. After Unicode NFKC and lowercase normalization they remain unique so picker results are unambiguous and must not collide with normalized intent keys or labels.

## Evidence and uncertainty

The proposal separates observed patterns from confidence in implementation:

- `verified-pattern` means the bounded audits or baselines contain concrete manifest, path, or implementation evidence for the pattern. It does not assert production correctness or live-provider accuracy.
- `platform-pattern` means the behavior follows the neutral base or audited current platform flow and is suitable as a shared implementation concern.
- `research-required` means implementation depends on a current external contract, live-domain accuracy, credentials, or a source-level question that the bounded audits did not prove.

Evidence-family keys distinguish the approved architecture, neutral shared base, seven vertical template families, the current cross-repository platform-flow audit, and the three no-skill baselines. Pandit is retained only as behavioral-reference evidence for neutral presentation factoring; no Pandit or Astra Guru brand identity becomes skill content. Legacy `supportedCapabilities`, `capabilityKey`, `capabilityFacet`, and discarded `astropages-capabilities` names are not taxonomy inputs, dependencies, or fallbacks.

Astrology feature intents that need provider capability are mapped to `astrology-provider-adapters` plus the applicable domain skill and declare `astrologyapi-mcp` and `project-secrets`. This expresses the architecture's builder-time MCP and generated-runtime secret boundaries without claiming a provider endpoint or calculation is already verified. The generic unsupported-provider intent maps to `research-external-integrations`, `integrations-webhooks-automation-and-consent`, and `runtime-config-secrets-and-provider-readiness`, with `official-web-research` and `project-secrets`; research establishes the official contract, the integration skill owns server-side connector mechanics, and readiness owns the same-commit `astropages/secrets.manifest.json` lifecycle, safe missing-secret preview, and Project Secrets Setup path.

## Coverage

| Category | Intent count |
|---|---:|
| Website Design | 8 |
| Content & Languages | 8 |
| Assets & Media | 8 |
| SEO & Discoverability | 8 |
| Marketing & Analytics | 8 |
| Store & Orders | 8 |
| Services & Bookings | 8 |
| Astrology Experiences | 10 |
| Customer Accounts | 8 |
| Integrations & Automation | 8 |
| Fix & Improve | 8 |
| **Total** | **90** |

All 11 categories have public intents. All 29 internal skills are referenced by at least one intent. Tool dependencies are limited to `emdash-mcp`, `project-assets`, `astrologyapi-mcp`, `official-web-research`, `project-secrets`, and `none`.

## Why 29 internal skills

The internal inventory is intentionally not one skill per public feature. A public intent composes the smallest useful set of durable implementation responsibilities: for example, a product page combines merchandising and visual-system guidance, while checkout combines commerce state with payment boundaries. Conversely, concerns with materially different trust boundaries remain separate: provider adapters do not own astrology presentation, Project Secrets readiness does not own vendor research, customer auth does not own generated-admin RBAC, and EmDash content release does not own code or skill release.

This balance gives each package enough cohesion to carry reusable instructions, fixtures, and tests across multiple intents without creating an oversized universal skill. It also prevents vertical template branding or deprecated capability labels from becoming execution architecture. The boundary summary on every internal skill makes overlaps explicit and gives Milestone 2 a reviewable starting point for package contents.

## Milestone 2 representative slices

The architecture's three Milestone 2 slices map explicitly as follows:

1. **Website Design:** public intent `refresh-homepage` maps to `generated-site-discovery-and-routing`, `astro-ui-and-design-system`, and `responsive-accessibility-and-performance`, with no external tool dependency. Its fixtures should use the neutral base and the no-skill design baseline to test preserved copy and bindings, accessible responsive behavior, and disciplined change scope.
2. **Panchang:** public intent `add-daily-panchang` maps to `astrology-provider-adapters` and `horoscope-panchang-numerology-and-tarot`, with `astrologyapi-mcp` and `project-secrets`. Its fixtures should preserve the Astra Guru implemented-versus-Jyoti Connect placeholder contrast and enforce `X_ASTROLOGYAPI_KEY`, safe missing-secret behavior, and no unsupported accuracy claims.
3. **Unsupported integration:** public intent `integrate-unsupported-provider` maps to `research-external-integrations`, `integrations-webhooks-automation-and-consent`, and `runtime-config-secrets-and-provider-readiness`, with `official-web-research` and `project-secrets`. Its fixtures should enforce current official-document research, server-only connector mechanics, code plus `astropages/secrets.manifest.json` in the same generated-repository commit, safe preview, direct Project Secrets Setup, and an actionable unsupported state when the contract cannot be established.

Milestone 2 may turn only these proposal mappings into schemas, skill packages, fixtures, and deterministic bundle tooling after Milestone 1 reviews approve this inventory.
