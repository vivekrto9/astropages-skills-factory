# Template Feature Audit — 2026-07-20

Status: Milestone 1 audit part 1 complete; research evidence only, not a skill inventory or runtime contract

## Methodology and limitations

The audit universe is the 26 directories matching `/Users/alokprasad/Desktop/Vedic-Rishi/astropages/templates/*/template.manifest.json`. For each directory, this pass read only `template.manifest.json`, recorded the repository's 7-character Git `HEAD`, and checked whether named representative source paths exist. It also checked existence of six shared platform paths and `astropages/secrets.manifest.json`. The committed Builder Skills v1 architecture and implementation ledger supplied the governing vocabulary and boundaries.

No source file contents, repository-wide diffs, builds, tests, deployments, browser flows, provider calls, or generated output were inspected. Consequently, `implemented` below means the manifest declares implemented behavior and the representative path exists; it does not prove correctness. `Gated` preserves non-placeholder manifest states such as session, SSO, CSRF, signature, or setup gates. `Placeholder + path` means the manifest remains authoritative for this audit even though a route-named source path exists; that is a drift hypothesis for later baselining, not proof of implementation. Repository branch names and cleanliness were not evaluated.

All evidence paths are exact paths relative to `/Users/alokprasad/Desktop/Vedic-Rishi/astropages/templates/`.

## All 26 templates

| Repository | Manifest key | HEAD | Family | Implemented/placeholder evidence | Representative exact source path |
|---|---|---:|---|---|---|
| `apt-astra-guru-meridian` | `astra-guru-meridian` | `174a018` | Astra Guru | Manifest: 98 implemented routes/APIs; path exists | `apt-astra-guru-meridian/src/pages/api/panchang/index.ts` |
| `aspt-astra-guru-dark` | `astra-guru-dark` | `c3b4851` | Astra Guru | Manifest: 98 implemented; path exists | `aspt-astra-guru-dark/src/styles/astra-guru-home.css` |
| `aspt-astra-guru-verdant` | `astra-guru-verdant` | `74286f2` | Astra Guru | Manifest: 98 implemented; path exists | `aspt-astra-guru-verdant/src/pages/free-tools/daily-panchang.astro` |
| `aspt-costar` | `aspt-costar` | `adc6b2e` | Costar | Manifest: 40 implemented; path exists | `aspt-costar/src/pages/api/astropages/generated-site/birth-chart.ts` |
| `aspt-costar-meridian` | `aspt-costar-meridian` | `8fdad83` | Costar | Manifest: 40 implemented; path exists | `aspt-costar-meridian/src/pages/daily-transits.astro` |
| `aspt-costar-nocturne` | `aspt-costar-nocturne` | `a958a41` | Costar | Manifest: 40 implemented; path exists | `aspt-costar-nocturne/src/pages/synastry.astro` |
| `aspt-costar-verdant` | `aspt-costar-verdant` | `ee7d253` | Costar | Manifest: 40 implemented; path exists | `aspt-costar-verdant/src/pages/birth-chart.astro` |
| `aspt-divyastra` | `divyastra` | `52dcd05` | Divyastra | Manifest: 26 implemented; path exists | `aspt-divyastra/src/pages/api/astropages/generated-site/customer-cart.ts` |
| `aspt-divyastra-Celestial-Indigo` | `divyastra-celestial-indigo` | `84b7197` | Divyastra | Manifest: 26 implemented; path exists | `aspt-divyastra-Celestial-Indigo/src/pages/wishlist.astro` |
| `aspt-divyastra-Sacred-Grove` | `divyastra-sacred-grove` | `1a75337` | Divyastra | Manifest: 26 implemented; path exists | `aspt-divyastra-Sacred-Grove/src/pages/order-history.astro` |
| `aspt-divyastra-electric-Bloom` | `divyastra-electric-bloom` | `27efb6b` | Divyastra | Manifest: 26 implemented; path exists | `aspt-divyastra-electric-Bloom/src/pages/reel-player.astro` |
| `aspt-jyoti-connect-purple` | `jyoti-connect-purple` | `d026bde` | Jyoti Connect | Manifest: 62 implemented + 3 placeholders (`/free-services`, `/calculators`, `/panchang`); route-named path exists | `aspt-jyoti-connect-purple/src/pages/panchang.astro` |
| `aspt-jyoti-connect-rich-spiritual` | `jyoti-connect-rich-spiritual` | `4ab6519` | Jyoti Connect | Manifest: 62 implemented + same 3 placeholders; route-named path exists | `aspt-jyoti-connect-rich-spiritual/src/pages/free-services.astro` |
| `aspt-jyoti-connect-soft-premium` | `jyoti-connect-soft-premium` | `b1cadaa` | Jyoti Connect | Manifest: 62 implemented + same 3 placeholders; route-named path exists | `aspt-jyoti-connect-soft-premium/src/pages/calculators.astro` |
| `jyoti-connect` | `jyoti-connect` | `24cf130` | Jyoti Connect | Manifest: 62 implemented + same 3 placeholders; route-named path exists | `jyoti-connect/src/lib/horoscope/panchang.ts` |
| `aspt-jyotish-live` | `jyotish-live-aggregator` | `3c5e20b` | Jyotish Live | Manifest: 73 implemented + 41 gated/special-state routes; path exists | `aspt-jyotish-live/src/pages/api/astropages/generated-site/advisor/bookings/index.ts` |
| `aspt-jyotish-live-dark` | `jyotish-live-aggregator-dark` | `9e61b59` | Jyotish Live | Manifest: 73 implemented + 41 gated/special-state routes; path exists | `aspt-jyotish-live-dark/src/pages/advisor/schedule.astro` |
| `aspt-jyotish-live-green` | `jyotish-live-aggregator-green` | `ecbc873` | Jyotish Live | Manifest: 73 implemented + 41 gated/special-state routes; path exists | `aspt-jyotish-live-green/src/pages/account/privacy.astro` |
| `aspt-jyotish-live-riso` | `jyotish-live-aggregator-riso` | `b4f46ec` | Jyotish Live | Manifest: 73 implemented + 41 gated/special-state routes; path exists | `aspt-jyotish-live-riso/src/pages/tarot.astro` |
| `aspt-pandit-style-multiservice-hub` | `pandit-style-hub` | `cd727e3` | Pandit | Manifest: 98 implemented; path exists | `aspt-pandit-style-multiservice-hub/src/layouts/AstraGuruLayout.astro` |
| `aspt-western-chani-astro` | `chani-aggregator` | `2d0c42c` | Chani | Manifest: 75 implemented + 11 session/CSRF-gated; path exists | `aspt-western-chani-astro/src/pages/api/astropages/generated-site/moon-guide.ts` |
| `aspt-western-chani-astro-paper` | `chani-aggregator-paper` | `c9375ba` | Chani | Manifest: 75 implemented + 11 session/CSRF-gated; path exists | `aspt-western-chani-astro-paper/src/pages/compatibility.astro` |
| `aspt-western-chani-astro-purple` | `chani-aggregator-purple` | `3e4ec7b` | Chani | Manifest: 75 implemented + 11 session/CSRF-gated; path exists | `aspt-western-chani-astro-purple/src/pages/moon-guide.astro` |
| `aspt-western-chani-astro-soft-premium` | `chani-aggregator-soft-premium` | `8fb2db4` | Chani | Manifest: 75 implemented + 11 session/CSRF-gated; path exists | `aspt-western-chani-astro-soft-premium/src/pages/chat/[sessionId].astro` |
| `aspt-western-chani-astro-warm-modern` | `chani-aggregator-warm-modern` | `3101d94` | Chani | Manifest: 75 implemented + 11 session/CSRF-gated; path exists | `aspt-western-chani-astro-warm-modern/src/pages/birth-chart.astro` |
| `base-template` | `astropages-base-template` | `7e36d4b` | Base | Manifest: 31 implemented core routes/APIs; path exists | `base-template/src/server/generated-site/content-release.ts` |

## Family summary

| Family | Repositories | Manifest-backed surface | Audit boundary |
|---|---:|---|---|
| Base | 1 | Neutral home/auth plus generated-site content, asset, runtime, and SSO APIs | Core reference, not a vertical feature family |
| Costar | 4 | Birth chart, transits, synastry, reports, shop | Four presentation variants; runtime parity untested |
| Astra Guru | 3 | Consultations, reports, Vedic free tools, panchang, puja, shop | Broad multiservice surface; provider behavior untested |
| Pandit | 1 | Same route/capability/localization/persistence declarations as Astra Guru Meridian | Branding/template boundary; see below |
| Divyastra | 4 | Commerce, customer/order flows, wishlist and reels | Four presentation variants; source behavior untested |
| Jyoti Connect | 4 | Horoscope, consultations, shop and blog; three placeholder tool routes | Route-named files suggest drift but do not override manifest status |
| Jyotish Live | 4 | Advisor/customer/admin marketplace, bookings, wallet/chat and integrations | Broad gated surface; gates and live providers untested |
| Chani | 5 | Western chart, moon, compatibility, reports, shop and wallet/chat | Session/CSRF gates preserved; live flows untested |

## Shared platform versus vertical features

Existence checks found `astro.config.mjs`, `src/live.config.ts`, `src/worker.ts`, `wrangler.jsonc`, `astropages/assets.manifest.json`, and `astropages/analytics.manifest.json` in all 26 repositories. Every template manifest also declares query-parameter localization and D1-backed `runtimePersistence`. These are shared generated-site platform concerns: layout/runtime bootstrap, content and locale lifecycle, asset handling, analytics, auth/SSO, SEO, persistence, and deployment configuration. They should be factored from a neutral core rather than duplicated as astrology-family behavior.

Vertical evidence comes from manifest route/API declarations: Costar charts/transits/synastry; Astra Guru/Pandit Vedic tools, reports, consultations, puja, and shop; Divyastra catalog/cart/wishlist/orders/reels; Jyoti Connect horoscope/consultations/shop/blog plus placeholder tools; Jyotish Live marketplace/portals/bookings/wallet/chat/integrations; and Chani Western chart/moon/compatibility/reports/wallet/chat. This is feature evidence for later inventory work, not a finalized category, intent, or internal-skill mapping.

## Pandit boundary and neutral base

The Pandit and Astra Guru Meridian manifests have different `templateKey` and `displayName` values but equal `supportedCapabilities`, visitor/API route records, localization, and runtime-persistence declarations. The Pandit repository also has the representative `src/layouts/AstraGuruLayout.astro` path. Within this pass's limits, Pandit is therefore a behavioral reference to the Astra Guru family with a distinct branding/template identity. Builder skills should encode reusable behavior such as panchang, bookings, reports, or commerce; they must not bake in Pandit or Astra Guru names, copy, colors, or brand assets. A future semantic source comparison may revise the relationship if behavior has diverged.

The base template manifest contains only the shared home/auth and generated-site platform surface, and its representative content-release server path exists. It is the neutral core reference. Vertical skills should layer onto that core and keep theme/brand selection separate from behavior.

## Evidence for the first three slices

- **Website Design:** all 26 repositories have the common Astro/runtime shell, and presentation-specific paths exist, including `aspt-astra-guru-dark/src/styles/astra-guru-home.css`, `aspt-pandit-style-multiservice-hub/src/layouts/AstraGuruLayout.astro`, and the base core. This slice can test neutral layout/style/navigation behavior while leaving branding as template input.
- **Panchang:** Astra Guru declares panchang/free-tool routes as implemented and `apt-astra-guru-meridian/src/pages/api/panchang/index.ts` exists. Jyoti Connect declares `/panchang` as placeholder while `jyoti-connect/src/lib/horoscope/panchang.ts` and variant page paths exist. This deliberate contrast supplies implemented and placeholder/drift fixtures without assuming live provider correctness.
- **Unsupported integration:** zero of 26 repositories has the architecture-required `astropages/secrets.manifest.json`, although manifests declare provider credentials and integration routes. The slice must therefore exercise the architecture's fixed unsupported-vendor flow: official-document research, server-side implementation, atomic code-plus-secret-manifest change, safe missing-secret preview, and Project Secrets setup link. Existing integration declarations are safety evidence, not proof that this contract is implemented.

## Deprecated evidence and uncertainties

Legacy `supportedCapabilities`, route `capabilityKey`, route `capabilityFacet`, and any historical capability-lock or capability-repository declarations are deprecated evidence only. They may help locate behavior, but they must not become Builder Skills v1 public categories, granular intent identifiers, internal skill architecture, dependencies, or fallback content.

Uncertainties remaining after this bounded pass:

- Native builds, tests, visual/accessibility checks, provider calls, and service baselines remain undone.
- A source-level inventory and semantic family-parity review remain undone; representative path existence is not implementation proof.
- Jyoti Connect's three placeholders may reflect stale manifests, partial pages, or intentional non-readiness.
- Gated Jyotish Live and Chani routes were not authenticated or exercised.
- No current template demonstrates the required `astropages/secrets.manifest.json` lifecycle.
- Repository branch/cleanliness, dependency versions, deployment state, and live credentials were outside scope.
- The final granular-intent/internal-skill inventory remains a Milestone 1 deliverable and must not be inferred from these family labels.
