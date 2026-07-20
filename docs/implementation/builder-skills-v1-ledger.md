# Builder Skills v1 Implementation Ledger

This is the durable resume point for the cross-repository Builder Skills v1 program. Update it at each verified checkpoint; record evidence, not intent.

## Invariants

- `astropages-skills-factory` is the sole authored content source.
- Bundles contain exact paths `dist/bundle/AGENTS.md`, `dist/bundle/.agents/skills/`, `dist/bundle/catalog/skills.json`, `dist/bundle/catalog/intents.json`, and `dist/bundle/bundle.manifest.json`. The manifest hashes sorted canonical records for every non-manifest file into `contentSha256`; deterministic uncompressed `skills-bundle.tar` gets an external `artifactSha256` stored only in the Control Plane build/attestation.
- Only signed Woodpecker runs for `vivekrto9/astropages-skills-factory` are trusted: PR/non-main runs use `skills_ci`; `main` uses `skills_release` with only its dedicated Control Plane callback URL/token to register a candidate.
- Control Plane persists immutable `builder_skill_builds`, `builder_skill_releases` with public catalog snapshots, append-only `builder_skill_release_events` exposed exactly as `release_events`, `(environment, channel)` current pointers for `stable`/`canary`, and `builder_chat_sessions.skill_release_id`. `BUILDER_SKILLS_V2_ENABLED` cohort resolution chooses legacy/stable/canary for a new conversation, then Control Plane pins once before AI dispatch. Admin changes pointers with CAS and audit; rollback targets the explicit previous pointer or an operator-selected eligible last-known-good release, never the current faulty release or a no-op. Existing pins remain unchanged.
- On candidate acceptance, Admin owns the DB semantic release version through an explicit `patch`, `minor`, `major`, or `custom` choice and supplies release notes/changelog; it separately owns promotion/rollback and cannot edit factory content.
- Control Plane rejects normalized catalog alias collisions and owns NFKC/lowercase exact word-boundary key/label/alias inference with no partial substring. An explicit user intent/action is authoritative; up to three unique exact matches are high-confidence, ambiguity asks for clarification with no marker, and no-match uses native OpenHands fallback.
- AI downloads the pinned artifact through an authenticated Control Plane endpoint, verifies release ID, `artifactSha256`, `contentSha256`, every per-file `sha256`, allowed paths, and no symlinks, atomically extracts only to `/app/agent_skills/releases/<release-id>`, mounts shared named storage read-only to the sandbox, and rejects continuation mismatches.
- A granular intent maps to one public category, one or more internal skills, and declared tool dependencies.
- Client is never authoritative for release, activation, tool, or secret decisions.
- AstrologyAPI MCP is attached only when the effective pinned intent/action requires it. Control Plane sends enablement only; trusted AI deployment secret/env management exclusively supplies `ASTROLOGYAPI_MCP_ENABLED`, `ASTROLOGYAPI_MCP_URL`, and `ASTROLOGYAPI_MCP_KEY`, and rotates the key. The AI proxy holds it in service memory and adds `x-astrologyapi-key` outbound, never to OpenHands env, skills, payloads, telemetry, or Control Plane; this platform config is not Task 11.
- Integrations use official vendor research, server-side implementation, one exact generated-repository commit for code plus `astropages/secrets.manifest.json`, safe previews, and Project Secrets Setup cards; generated AstrologyAPI runtime binds `X_ASTROLOGYAPI_KEY`.
- OpenHands SDK is pinned to 1.24; internal skills resolved from an explicit user intent/action or deterministic high-confidence inference get collision-resistant unique `KeywordTrigger` markers appended by AI, while ordinary discovery stays progressive.
- Client provides a grouped `@` picker, Skills button, and `Using`/`Auto` indicators.
- The exact flag is `BUILDER_SKILLS_V2_ENABLED`.
- Discarded `astropages-capabilities` is research only and never a source, dependency, or fallback.
- Task 11 alone is excluded. Production mutation during evaluation requires explicit authorization; authorized live canary/cutover/removal are Milestone 10 gates.

## Checkpoint — 2026-07-20

Status: **Milestones 0–1 complete; Milestone 2 in progress**

Default-branch starting SHAs:

| Repository | SHA |
|---|---|
| Factory | `d484d8d` |
| Control Plane | `1e5d853` |
| Client | `a4598c6` |
| Admin | `c9593c5` |
| AI | `4367751` |

Feature branches and worktrees:

| Repository | Branch | Worktree |
|---|---|---|
| Factory | `feat/builder-skills-v1` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-skills-factory/builder-skills-v1` |
| Control Plane | `feat/builder-skills-v1` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-control-plane-service/builder-skills-v1` |
| Client | `feat/builder-skills-v1` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-client/builder-skills-v1` |
| Admin | `feat/builder-skills-v1` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-admin/builder-skills-v1` |
| AI | `feat/builder-skills-v1` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-ai-service/builder-skills-v1` |

Verified Milestone 0 baseline evidence:

| Repository | Absolute workdir | Exact command | Result | Observed runtime/tool |
|---|---|---|---|---|
| Factory | `/Users/alokprasad/.config/superpowers/worktrees/astropages-skills-factory/builder-skills-v1` | No command: no package or executable baseline exists yet | Documentation-only; no executable baseline | Not observed |
| Control Plane | `/Users/alokprasad/.config/superpowers/worktrees/astropages-control-plane-service/builder-skills-v1` | `npm test -- --runInBand` | Exit 0; 141 suites / 1119 tests | Not recorded |
| Client | `/Users/alokprasad/.config/superpowers/worktrees/astropages-client/builder-skills-v1` | `npm test` | Exit 0; 64 suites / 376 tests | Node 24.11.1 observed for Vitest |
| Admin | `/Users/alokprasad/.config/superpowers/worktrees/astropages-admin/builder-skills-v1` | `npm test` | Exit 0; 26 suites / 124 tests | Node 24.11.1 observed for Vitest |
| AI setup | `/Users/alokprasad/.config/superpowers/worktrees/astropages-ai-service/builder-skills-v1` | `uv sync --python 3.12 --extra dev` | Exit 0 | Python 3.12.13 |
| AI tests | `/Users/alokprasad/.config/superpowers/worktrees/astropages-ai-service/builder-skills-v1` | `uv run --python 3.12 pytest` | Exit 0; 246 tests | Python 3.12.13; pytest 9.0.3 |

The initial attempt to pass Vitest `--runInBand` and the initial `uv` dev-extra form were incorrect. Client/Admin were corrected to their exact `npm test` commands; AI was corrected to `uv sync --python 3.12 --extra dev` followed by `uv run --python 3.12 pytest`. Control Plane's recorded native baseline command is `npm test -- --runInBand`. These command corrections required no source changes.

Completed at this checkpoint:

- Architecture decision record created.
- Initial cross-repository SHAs and baseline results recorded.
- Specification review: **APPROVED** on 2026-07-20.
- Quality review: **APPROVED** on 2026-07-20.
- Closeout verification: `git diff --check` — exit 0.

Milestone 0 completion gate:

- The specification must be **APPROVED** and quality review must be **APPROVED**.
- Both approvals are recorded above; Milestone 0 is complete.

Not completed or claimed:

- No factory schema, skill content, pipeline, bundle, runtime integration, UI, release, migration, canary, deployment, or legacy removal has been implemented.

Milestone 1 audit part 1 completed on 2026-07-20:

- Audited all 26 current template manifests under `/Users/alokprasad/Desktop/Vedic-Rishi/astropages/templates`, recorded each 7-character repository HEAD, and checked existence of representative source paths.
- Recorded manifest-backed family evidence, implemented/placeholder distinctions, shared-platform versus vertical boundaries, the Pandit behavioral-reference/branding boundary, and the neutral base core in `docs/research/template-feature-audit-2026-07-20.md`.
- Recorded evidence for the first Website Design, Panchang, and unsupported-integration slices without claiming source/runtime correctness.
- Treated legacy capability declarations as deprecated evidence only.
- Part 1 specification review: **APPROVED** on 2026-07-20.
- Part 1 quality review: **APPROVED** on 2026-07-20.
- Part 1 closeout verification: `git diff --check` — exit 0.

Milestone 1 no-skill builder baselines completed on 2026-07-20:

- Captured three scenarios at `2026-07-20T13:57:12Z` from full base-template SHA `7e36d4b875c53c9690fa17be699bf17dea9fa8a8` without a Builder Skills v1 bundle or content. Generic process skills and tools were available and recorded in the original agent sessions, but are not embedded in this factory artifact.
- Recorded stable run IDs, dispatcher-provided prompts, output content digests, numeric diff metrics, agent-reported verification checks, stable rubric findings, strengths, failures, and future skill requirements in `evals/baselines/scenarios.json` and `evals/baselines/2026-07-20.md`; prompt fidelity is not independently reconstructable from the dirty worktrees.
- The Website Design output preserved copy, CMS bindings, responsive behavior, and accessibility, but its tracked page/CSS diff was 405 insertions and 68 deletions and it added decorative UI; scope discipline remains measurable. The 93/93 verification result is agent-reported. Browser evidence remains in `/root/baseline_design_eval` and is not embedded in this baseline artifact.
- For Panchang, the agent reported using AstrologyAPI documentation, including the advanced Panchang and API-reference URLs recorded in the baseline. Source contents and research output remain in `/root/baseline_panchang_eval` and are not embedded in this artifact. The output invented `ASTROLOGY_API_USER_ID` and `ASTROLOGY_API_KEY`, used a legacy capabilities vendor path and environment documentation, omitted `astropages/secrets.manifest.json`, made an unverified Lahiri claim, and had no live accuracy check. The 101/101 verification result is agent-reported. Route-manifest ownership remains pending the current-flow audit.
- For HubSpot, the agent reported using the official contacts and notes guide URLs recorded in the baseline. Source contents and research output remain in `/root/baseline_hubspot_eval` and are not embedded in this artifact. The output used server-only handling, focused tests, and a specific missing-configuration API message, but changed the global Cloudflare secret contract and safety scanner, used environment examples and README for setup, added a deprecated manifest `capabilityKey`, omitted `astropages/secrets.manifest.json` and an initial Project Secrets Setup state, and had no live provider test. The 99/99 verification result is agent-reported. Its polished public copy, home-page, and CSS work is not scored as a failure.
- Future integration requirements make official-document research mandatory and `documentationUrl` optional; generated code and `astropages/secrets.manifest.json` must land and be synchronized in the same exact generated-repository commit, with synchronization ownership to be recorded by the current-flow audit.
- All three disposable evaluation worktrees remain dirty and uncommitted for review and must be removed later. No baseline patch or skill content was copied into the factory.
- Baseline-record specification review: **APPROVED** on 2026-07-20.
- Baseline-record quality review: **APPROVED** on 2026-07-20.
- Baseline-record validation confirmed JSON parsing and required schema shape, stable run/task provenance, numeric diff metrics, stable rubric findings, and all three output content digests against the current modified-plus-untracked file sets — exit 0.
- Baseline-record closeout verification: `git diff --check` — exit 0.

Milestone 1 current Builder Skills and Project Secrets flow audit completed on 2026-07-20:

- Audited the current Control Plane, Client, AI, and relevant Admin source at the unchanged checkpoint commits and recorded exact tables, relevant skill-selection/session-message and Project Secrets routes, modules, synchronization triggers, propagation boundaries, and v1 reuse/replacement decisions in `docs/research/current-builder-skills-and-secrets-flow-2026-07-20.md`.
- Confirmed that Control Plane owns both current worker-manifest pull synchronization and generated-repository secret-manifest synchronization. Secret manifests are read from the exact deployment commit: after a ready preview callback and before production dispatch.
- Confirmed that current Client-selected skills are validated against `builder_chat_sessions.skill_snapshot` but reach AI only as prompt text, while AI independently loads project/shared skills through OpenHands SDK 1.24 and a read-only shared volume.
- Confirmed the current Project Secrets value boundary: Client writes values through the authenticated project API; Cloudflare Secret Store holds the runtime bundle; AI receives key metadata only. Optional `documentationUrl` is not currently accepted or rendered.
- Recorded the reusable EmDash per-conversation MCP proxy pattern and the current five Woodpecker purposes plus configuration-extension/trusted-deployer modules; no current `skills_ci` or `skills_release` purpose exists.
- Current-flow audit specification review: **APPROVED** on 2026-07-20.
- Current-flow audit quality review: **APPROVED** on 2026-07-20.
- Current-flow audit closeout verification: `git diff --check` — exit 0.

Milestone 1 final inventory completed on 2026-07-20:

- Added the review proposal in `docs/research/skill-inventory-v1.md` and deterministic machine-readable inventory in `docs/research/skill-inventory-v1.json`.
- Proposed the exact ordered 11 public categories, 90 granular public intents, and 29 private cohesive internal skills without turning template-family labels or legacy capability declarations into architecture.
- Recorded evidence families and uncertainty per intent, global normalized alias constraints, tool dependencies, internal-skill boundaries, and explicit Milestone 2 mappings for Website Design, Panchang, and unsupported integration.
- Inventory validation confirmed JSON parsing, proposal status, exact category order, unique category/intent/internal-skill keys, normalized collision-free aliases, valid category/internal-skill/evidence/tool references, 90 intents, use of every category and internal skill, exact 29-name agreement, and required mappings for provider-dependent astrology and unsupported integration — exit 0.
- The unsupported-provider slice composes three distinct responsibilities: official-contract research and unsupported-state decisions, server-side connector mechanics, and Project Secrets/readiness behavior. It does not treat researched setup scaffolding as a completed integration.
- Final inventory specification review: **APPROVED** on 2026-07-20.
- Final inventory quality review: **APPROVED** on 2026-07-20 after closing the server-side connector responsibility gap.
- Inventory closeout verification: `git diff --check` — exit 0.

Milestone 1 is complete. At its closeout checkpoint, no factory schema, `SKILL.md`, catalog, fixture, build tooling, or runtime implementation had been added.

Milestone 2A factory scaffold and deterministic tooling implemented on 2026-07-20:

- Added the maintainable authored-source layout `source/foundation`, `source/catalog`, and `source/skills`, without importing the discarded capabilities-repository structure. The tracked pre-slice catalog contains the exact ordered 11 public categories and intentionally contains zero intents, skills, and template-evidence records; substantive slice content remains Milestone 2B work.
- Added closed draft-2020-12 JSON Schemas for category, intent, internal skill, template-evidence record, and bundle manifest records under stable `https://astropages.com/schemas/builder-skills/v1/*` IDs. The maintained Ajv 2020 validator compiles every schema and applies it to every authored record and the generated manifest; validation requires all five published schemas and the exact `>=1.24.0 <1.25.0` OpenHands SDK compatibility range.
- Added Node ESM validation for exact category keys/labels/order, globally NFKC/lowercase-normalized routing-term collisions, unique IDs, reciprocal intent/skill references, the fixed tool-dependency allowlist, confined normalized paths, duplicate output paths, and AgentSkills `SKILL.md` entry/frontmatter rules.
- Added fail-closed source checks for missing/undeclared files, symlinks, special or executable payloads, binary/NUL content, likely secret values, branded legacy generated-site names, and unsafe browser-secret guidance.
- Added a template-evidence audit hook that validates pinned 40-character commits and confined evidence paths and, when supplied `--templates-root`, verifies exact checkout HEADs, resolves every path from the declared Git object, rejects untracked paths, and rejects symlinks or escapes in both Git and checkout path components.
- Added canonical JSON generation and deterministic uncompressed ustar output. `dist/bundle` contains only `AGENTS.md`, `.agents/skills`, `catalog/intents.json`, `catalog/skills.json`, and the non-circular `bundle.manifest.json`; records are UTF-8 path-sorted and contain byte size and SHA-256. Tar entries normalize mtime/uid/gid/mode. The archive SHA exists only in `dist/build-attestation.json`, outside the tar and manifest.
- Toolchain source is locked by `.node-version` (`24.11.1`), `packageManager` (`npm@11.7.0`), and `package-lock.json`; Ajv is locked at `8.20.0`; generated artifacts, private staging/backup paths, and `node_modules` are ignored. No repository CI YAML or callback/release implementation was added.
- TDD RED: `node --test tests/factory.test.mjs` exited 1 with 0/16 assertions passing before `scripts/factory.mjs` existed. A later focused schema-presence test also exited 1 before schema presence became a validation contract.
- Specification-hardening RED: the focused 13-check exploit suite exited 1 with 12 expected failures and one pre-existing duplicate-resource check passing. Failures proved missing enforcement for malformed schemas, catalog/schema drift, entry/resource overlap, ill-formed UTF-8, untracked or symlink-component template evidence, and symlink-redirected output paths.
- The earlier 30/30 green run included a caller-supplied source-commit override and arbitrary output-directory support. Quality review rejected those contracts; its local digests are superseded and are not valid provenance or release evidence.
- Quality-hardening RED: a focused 22-check run exited 1 with 19 expected failures and three pre-existing checks passing. Failures covered source/catalog bounds, C0/C1 strings, confusing resource names, a raw malformed-record error, strict CLI parsing, clean/existing/exact Git provenance, and protection of an unrecognized `dist`.
- Quality-hardening GREEN with pinned Node/npm: direct `node --test tests/factory.test.mjs` — exit 0, 81/81 tests; `npm run validate` — exit 0, 11 categories / 0 pre-slice intents / 0 pre-slice skills; `npm run safety` — exit 0, 5 source files; `npm run audit` — exit 0, 0 pre-slice evidence records; `npm audit` — exit 0, 0 vulnerabilities; `git diff --check` — exit 0. Tests use newly initialized, committed, clean Git fixtures and independently recompute every payload size/hash, `contentSha256`, archive SHA, and tar path/body/checksum/metadata contract.
- All authored text and schemas use fatal UTF-8 decoding before parsing or normalization. Catalog and source limits bound list/string/file counts and bytes; bundle generation separately bounds payload count/bytes and archive size. Resource paths use unambiguous printable ASCII segments, and C0/C1 catalog content is rejected.
- Public `build` owns only `<factory-root>/dist`, accepts only optional `--expected-commit`, resolves an existing exact `HEAD`, and requires a completely clean tracked/untracked checkout. It renders into a newly created private staging directory and replaces only a directory carrying the exact factory ownership marker. Self-consistent digests are integrity metadata, not ownership proof; pristine and digest-adjusted pre-marker artifacts are preserved and rejected. Public arbitrary output deletion and source-commit overrides do not exist. Reproducibility uses only newly created private temporary outputs.
- Marker-regression RED: the focused three-check test exited 1 with both pristine and digest-adjusted pre-marker cases being incorrectly replaced. GREEN: the same three checks pass after removing pre-marker compatibility entirely; no migration tar parser exists in production tooling.
- Provenance/evidence RED: the first focused evidence-path run exited 1 with newline and non-ASCII paths still accepted; the focused provenance run exited 1 with ignored declared resources and assume-unchanged byte changes still accepted. Final focused hardening RED exited 1 with 13 failures: repeated null/mixed invalid records raw-dereferenced in all four catalogs, and byte-identical external symlinks hidden with `assume-unchanged` were accepted for each root build input. GREEN: the focused 28/28 checks and full 81/81 suite pass. Exact-HEAD provenance enumerates every file under `source`, `schemas`, `lib`, and `scripts` plus `package.json`, `package-lock.json`, and `.node-version`; every path, including all three root inputs, passes the same `lstat` regular/non-symlink gate, must be a tracked HEAD blob, and must be byte-identical. Only ignored `dist`, `node_modules`, and private staging/backup directories are allowed. Template-evidence paths are schema-backed bounded printable canonical ASCII paths that retain legitimate repository punctuation. Repeated null, scalar, missing-ID, and mixed invalid shapes across categories, intents, skills, and evidence all return actionable `FactoryValidationError` diagnostics without raw runtime errors.
- The earlier agent-created pre-marker `dist` was moved non-destructively to `/tmp/astropages-skills-premarker.9NlTkp/dist`. The reviewed scaffold was committed as `9317421ca7aaca91683ab5b7ee710f42bd3bae28`, after which the exact clean-HEAD gates passed: `npm test` (81/81), validate, safety, checkout-backed evidence audit, build, reproducibility, dependency audit, independent tar listing/SHA, `git diff --check`, and clean `git status`. That commit produced `contentSha256=2f9c3b56397df0da66bb373e7a75df9aaeace2e224211240551e69a1ba077a80` and `artifactSha256=ef325917202d8854593bbc748635f69045520b378667746a571b74fe81400239`; it is a verified pre-slice artifact, not a candidate or release.
- Milestone 2A specification review: **APPROVED** on 2026-07-20 after adversarial re-review of schema application, archive/path handling, evidence anchoring, clean-HEAD provenance, output ownership, root-input symlinks, and malformed input behavior.
- Milestone 2A quality review: **APPROVED** on 2026-07-20 after adversarial re-review of destructive-output prevention, exact tracked-byte provenance, bounded inputs, strict CLI behavior, structured diagnostics, schema ownership, and independent digest/tar verification.

Milestone 2A is complete.

Milestone 2B three-slice implementation checkpoint on 2026-07-20:

- Added exactly the approved public intents `refresh-homepage`, `add-daily-panchang`, and `integrate-unsupported-provider`, with the inventory-owned labels, categories, internal-skill mappings, and tool dependencies. Public labels, descriptions, aliases, and examples contain no private internal-skill identifiers.
- Added exactly eight private AgentSkills at version `1.0.0`: `generated-site-discovery-and-routing`, `astro-ui-and-design-system`, `responsive-accessibility-and-performance`, `astrology-provider-adapters`, `horoscope-panchang-numerology-and-tarot`, `research-external-integrations`, `integrations-webhooks-automation-and-consent`, and `runtime-config-secrets-and-provider-readiness`. Three concise references carry provider-verification, official-contract-record, and Project Secrets manifest details without duplicating the main instructions.
- The Website Design slice requires target-repository discovery, the smallest safe change surface, preservation of copy/EmDash bindings/brand, reuse of the existing design system, the Pandit branding boundary, responsive/keyboard/focus/reduced-motion checks, browser inspection, and focused-then-full verification.
- `astrology-provider-adapters` is the sole skill that owns the AstrologyAPI MCP flow. It constrains MCP to builder-time official capability/schema discovery, forbids invented endpoints/schema/calculation claims, and consumes the existing catalog-managed server binding `X_ASTROLOGYAPI_KEY` through the target repository's current resolver. That reserved key must not be redeclared in `astropages/secrets.manifest.json`. Missing binding or MCP availability produces an honest no-live-call blocked/readiness state, and Task 11 account/key provisioning and usage work remains excluded. Panchang presentation carries date, location, and time zone and cannot assert calculation method, accuracy, or provider success without contract and controlled-live evidence.
- The unsupported-provider slice composes all three inventory responsibilities: current official-document research and actionable unsupported decisions; real server-side request/webhook/automation/consent mechanics; and Project Secrets readiness. Custom non-reserved keys require code plus `astropages/secrets.manifest.json` in the same exact generated-repository commit and optional validated relevant official HTTPS `documentationUrl`. Generated runtime emits a no-live-call structured readiness state; Builder Client owns the Project Secrets Setup card and link and generated-domain code must not guess that URL.
- Added deterministic external evaluation/golden contracts in `evals/contracts/three-slices.json`. They specify stable prompts, required outcomes, forbidden outcomes, and skill-text invariants for later forward agent evaluations. They do not contain fabricated provider endpoints or claim that a forward evaluation has run.
- Added three checkout-backed template-evidence records with exact full SHAs and only slice-relevant paths: neutral base `7e36d4b875c53c9690fa17be699bf17dea9fa8a8`, Astra Guru Meridian `174a01847df4486a6d7eded1a8db963b3d7ebe28`, and Pandit `cd727e3415351690af19affac3703ccfd87c5d14`.
- TDD RED: before any slice source existed, `node --test tests/three-slices.test.mjs` exited 1 with 7 tests, one incidental empty-catalog copy check passing, and six expected failures for the absent three intents/eight skills, skill instructions, eval contract, and template evidence. A later Panchang Project Secrets hardening test exited 1 before same-commit manifest and Setup-state instructions were added.
- Focused GREEN: `node --test tests/three-slices.test.mjs` exited 0 with 7/7 tests after the initial content; after Panchang secret-flow hardening, `node --test --test-name-pattern='Panchang instructions' tests/three-slices.test.mjs` exited 0 with 1/1 focused test.
- Initial dirty-worktree GREEN after Panchang hardening: `npm test` exited 0 with 88/88 tests; `npm run validate` reported 11 categories / 3 intents / 8 skills; `npm run safety` scanned 16 files; checkout-backed `npm run audit -- --templates-root /Users/alokprasad/Desktop/Vedic-Rishi/astropages/templates` audited all three records; `npm audit` reported zero vulnerabilities; and `git diff --check` exited 0.
- All eight skill folders passed the Skill Creator `quick_validate.py`. As designed, `npm run build` and `npm run reproducibility` each exited 1 with `Git checkout must be completely clean before attesting; dirty or untracked paths are present`; root must rerun both from the exact clean committed HEAD.
- Specification-correction RED on 2026-07-21: `node --test tests/three-slices.test.mjs` exited 1 with 8 tests, six passing and two expected failures. The eval contract lacked baseline identity, exact prompts, fixture/setup, and activation expectations; the integration skill prescribed webhook signature/timestamp/event-ID behavior without first proving provider support. The new exhaustive sole-owner regression already passed while scanning every declared skill entry and resource.
- Specification-correction GREEN: all three forward scenarios now use the exact corresponding prompts in `evals/baselines/scenarios.json`; each pins repository `base-template`, full commit `7e36d4b875c53c9690fa17be699bf17dea9fa8a8`, a new clean disposable worktree, the candidate bundle under test, and no reuse of baseline output. Activation is explicit for homepage and HubSpot, and automatic inference with no selected intent for Panchang; every scenario records the expected resulting intent.
- Webhook implementation is now conditional on a verified official contract. It selects the strongest officially documented authenticity and replay controls available, forbids invented signature formats, timestamps, event IDs, retry behavior, or ordering guarantees, and returns an actionable unsupported state when authenticity cannot be established. The external-integration reference records only provider-supported controls.
- The AstrologyAPI MCP ownership regression reads every declared `SKILL.md` and declared resource; only files inside `astrology-provider-adapters` may mention or instruct that MCP flow.
- Pre-activation-correction dirty-worktree GREEN: focused slice tests passed 8/8; `npm test` passed 89/89; all eight Skill Creator validations passed; validate reported 11 categories / 3 intents / 8 skills; safety scanned 16 source files; checkout-backed evidence audit passed all three records; dependency audit reported zero vulnerabilities; and `git diff --check` exited 0. No forward scenario has run yet.
- Automatic-activation RED on 2026-07-21: the focused `Daily Panchang alias` test exited 1 because the exact baseline prompt did not contain the full label or either approved alias, so deterministic exact-boundary inference could not select `add-daily-panchang`.
- Automatic-activation GREEN: added the smallest stable alias `daily panchang` to both the approved 90-intent inventory and runtime slice catalog. The test implements NFKC/lowercase Unicode letter/number boundary matching, rejects the substring-only `predaily panchangpost`, proves the unchanged exact baseline prompt resolves only `add-daily-panchang` in Auto mode, asserts all runtime Panchang fields remain aligned with the approved inventory, and confirms all key/label/alias routing terms across all 90 inventory intents are normalized collision-free.
- Final post-activation-correction dirty-worktree GREEN: the focused inference test passed 1/1; `npm test` passed 90/90; validate reported 11 categories / 3 intents / 8 skills; safety scanned 16 source files; checkout-backed evidence audit passed all three records; dependency audit reported zero vulnerabilities; and `git diff --check` exited 0. The exact Panchang baseline prompt and forward-eval no-run boundary remain unchanged.
- Quality-correction RED: the focused nine-test slice suite had three expected failures because it still prescribed invalid manifest redeclaration for the catalog-managed AstrologyAPI key, omitted bounded public-mutation/data-lifecycle guidance, and lacked explicit MCP dependency provenance/status. GREEN: all 9/9 focused tests pass after correcting those boundaries. The current Milestone 2 Panchang forward case expects an actionable blocked/no-code result because the conversation-scoped MCP proxy is not implemented yet; its successful implementation path is explicitly rerun after Milestone 8 with observed proxy/tool provenance, never fabricated output.
- Public integration mechanics now reuse proportionate existing CSRF/origin, spam/abuse, rate-limit, duplicate-submit, and idempotency conventions. Consent, retention, and deletion work is conditional on the verified purpose, provider contract, applicable existing policy, and requested scope rather than an unconditional database/policy expansion.
- Milestone 2B specification review: **APPROVED** on 2026-07-21 after exact prompt/fixture/activation, webhook-contract, MCP ownership, and exact-boundary inference corrections.

Milestone 2 remained in progress at the content checkpoint; forward results and the clean-HEAD artifact are recorded below. Candidate publication, approval, deployment, canary, and a successful MCP-backed Panchang run had not occurred.

Milestone 2B forward evaluation checkpoint on 2026-07-21:

- The exact candidate at `49e69ccd5c223811e4609c440b3f51c8527d3593` built reproducibly with `contentSha256=bde7063f402edf2c709e461a010e49f86c588c457f9331138636f4375ab8139a` and `artifactSha256=20e27b1edbd8ff7361ab2f39eb07cb30a2a6cad3e00eda5f7ac6cd4c56aec3f1`.
- Recorded all three forward outcomes in `evals/results/2026-07-21-three-slices.json` against the exact neutral-base fixture commit. Homepage completed with a smaller two-file diff and full verification. HubSpot completed as a real server-only integration using official documentation, same-worktree custom secret manifest, structured readiness, and full verification without a live-provider claim. Panchang correctly made zero changes and returned an actionable block because the real AstrologyAPI MCP dependency is not attached yet.
- The HubSpot run exposed a real platform gap: current Project Secrets manifest validation does not yet accept optional `documentationUrl`; later integration work must add that forward-compatible schema/UI support before the optional field is emitted.
- The successful Panchang forward evaluation remains a Milestone 8 gate. Its current blocked result is expected safety behavior, not feature completion.

Milestone 2 remains in progress. Next action: implement the Control Plane, AI, and Client vertical path required to run these skills through a real pinned conversation.

Milestone 9 factory-source expansion checkpoint on 2026-07-21:

- Expanded the runtime catalog from the three evaluated slices to the approved complete inventory: exactly 90 ordered public intents, all 11 ordered UI categories, and exactly 29 private internal skills. Public aliases, examples, category mapping, internal-skill mapping, and tool dependencies are copied deterministically from `docs/research/skill-inventory-v1.json` by `npm run sync:catalog`.
- Preserved the eight previously evaluated skill entries and their three declared references without editing their instruction files or weakening their constraints. Their catalog descriptions/resources are fixed inputs to the deterministic sync rather than inferred from a mutable generated catalog.
- Added 21 concise operational AgentSkills for navigation/search, EmDash content releases, localization, SEO/AEO, governed assets, media, forms, analytics, commerce, booking, portals, customer accounts, wallet/chat, chart experiences, reports/AI chat, notifications, D1 integrity, generated admin security, and diagnosis. Each requires target-repository inspection, a bounded realistic implementation, existing AstroPages ownership/security contracts, proportionate tests, and explicit evidence/limitations; none claims provider or deployment success from scaffolding.
- Added targeted full-catalog regressions for exact 90/29 inventory alignment, every reverse intent-to-skill mapping, all 11 non-empty categories with stable icons/order, public/private copy separation, operational instruction coverage for all new skills, absence of legacy generated-site branding, and absence of literal credential values. Updated the representative-slice regression to remain exact within the expanded catalog.
- TDD RED: `node --test tests/full-catalog.test.mjs` exited 1 with 0/4 tests passing against the three-intent/eight-skill catalog; after deterministic catalog generation it still failed on the first absent new `SKILL.md`. GREEN: the focused catalog/slice suite passed 13/13 and the clean-HEAD full suite passed 94/94.
- All 29 folders passed the Skill Creator `quick_validate.py`. The factory validator reported 11 categories / 90 intents / 29 skills; the source safety scan passed all 37 source files; the checkout-backed evidence audit passed all three pinned template records; `npm audit` reported zero vulnerabilities; and `git diff --check` passed.
- Exact clean commit `734dd3c71c80b9b7512d8ba85a71b078b1379c72` passed reproducibility and build with 35 bundle payload files, `contentSha256=c0810a7c57b86d1df5ca7345db86d9b834b53c06391011ac406b94057c0be115`, and `artifactSha256=80ad51cddbcf7281c0af8a8f8df9425dfed331aec83be26cf6a3179afd33b90d`.

This completes the authored Factory catalog expansion only. Release publication, Control Plane promotion, AI loading, Client exposure, MCP-backed Panchang success, canary evidence, and legacy removal remain separate gates and are not implied by this checkpoint.

## Milestone index

0. Grounding and documentation — **complete**
1. Audit and baselines — **complete**
2. Factory plus three slices — **in progress (three slices implemented; review, clean-HEAD artifact, and forward evaluations pending)**
3. Control Plane
4. Woodpecker
5. Admin
6. AI
7. Client
8. MCP and integrations
9. Expand
10. Cutover and removal

## Repeatable resume checklist

1. Read `docs/architecture/builder-skills-v1.md` and this ledger completely.
2. Confirm the active repository, worktree, branch, and clean/dirty state before editing.
3. Compare repository default-branch SHAs with the checkpoint; record drift rather than silently rebasing assumptions.
4. Inspect uncommitted changes and preserve unrelated user work.
5. Re-run the exact baseline commands and absolute workdirs recorded above; do not pass `--runInBand` to Vitest or use the superseded `uv` dev-extra form.
6. Confirm the current milestone, its entry criteria, and its explicit exclusions.
7. Verify proposed work preserves every invariant above and the signed repository/purpose allowlist.
8. Make only milestone-scoped changes, then run focused and full relevant verification.
9. Record exact commands, results, changed files, decisions, branch/worktree paths, and new HEAD SHAs.
10. Update this ledger only after evidence exists; never infer deployment, promotion, or completion from merged source alone.
