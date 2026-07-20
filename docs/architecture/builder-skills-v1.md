# Builder Skills v1 Architecture

Status: Approved implementation architecture
Milestone: 0 — architecture and baseline only
Date: 2026-07-20

## 1. Scope and outcome

Builder Skills v1 gives the AI website builder a governed catalog of reusable skills. The catalog is authored in one factory repository, built into a deterministic signed bundle, released through the Control Plane, pinned by Control Plane before AI dispatch, and surfaced through an adaptive Client experience. Admin can promote or roll back existing releases; it cannot edit skill content.

This document fixes the v1 boundaries and contracts. It does not claim that any runtime component, release, migration, or deployment exists yet.

Task 11 alone is explicitly outside this program. Milestones 0–10 include production release, live canaries, cutover, and legacy removal as completion gates. Any evaluation step that mutates production state requires explicit authorization at execution time.

## 2. Taxonomy and ownership

### 2.1 Sole source of skill content

`astropages-skills-factory` is the sole source of authored skill content, metadata, taxonomy mappings, fixtures, and bundle-generation inputs. Runtime repositories must not carry editable or fallback copies of factory content. Generated test fixtures may be pinned by digest when needed, but they are not an authoring surface.

Changes flow in one direction:

`factory source -> validated deterministic bundle -> immutable Control Plane release -> pinned AI conversation -> Client presentation`

### 2.2 Three distinct taxonomy layers

The public category is a browsing and explanation aid, not an execution unit. A granular intent is the stable routing unit. An internal OpenHands skill is the executable unit loaded into an AI conversation.

- **Public category:** stable, human-readable grouping visible in Client.
- **Granular intent:** versioned identifier selected by deterministic or model-assisted routing, for example `website.navigation.add` or `astrology.panchang.add`.
- **Internal OpenHands skill:** one implementation-oriented instruction package. It may serve one or more intents and is never exposed as an unrestricted public catalog object.

The approved public categories, in display order, are:

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

Every published granular intent must map to exactly one public category, one or more internal skill versions, and any required tool dependencies. A skill may implement multiple intents. Category names and order are release metadata and cannot be inferred from directory names. Renaming an intent or changing its semantics requires a new identifier or an explicit compatibility alias; published identifiers are never silently repurposed.

## 3. Factory contract and deterministic bundle

The factory source contains only reviewable text/configuration, schemas, fixtures, and tests required to produce the bundle. Each skill has a stable ID, semantic version, description, activation metadata, compatible AI runtime range, entry document, declared resources, and intent mappings. Paths are relative, normalized, and confined to the skill directory.

The build target is `dist/bundle/`. Its exact generated contract is `AGENTS.md`, `.agents/skills/`, `catalog/skills.json`, `catalog/intents.json`, and `bundle.manifest.json`. `catalog/skills.json` describes internal skill packages; `catalog/intents.json` carries the ordered public taxonomy and intent-to-skill/tool mappings.

`bundle.manifest.json` avoids circular identity: it inventories every non-manifest file as canonical records of normalized `path`, byte `size`, and file `sha256`, sorted by path. Its `contentSha256` is SHA-256 over the canonical JSON encoding of that ordered records array. The manifest does not inventory or hash itself and does not contain the archive hash. The publisher creates deterministic, uncompressed `skills-bundle.tar`; `artifactSha256` is computed externally over the completed tar and stored in the Control Plane build record and signed attestation, never inside the tar. Determinism means the same source commit and toolchain lock produce byte-identical output:

- files are sorted by normalized UTF-8 path;
- timestamps, owners, groups, permissions, locale, and line endings are normalized;
- generated JSON uses canonical key order and encoding;
- undeclared files, symlinks, absolute paths, traversal segments, duplicate paths, and executable payloads are rejected;
- source commit, schema version, builder version, and the non-circular file records are recorded in the manifest;
- the external `artifactSha256` is the immutable artifact identity.

CI validates schemas, referential integrity, normalized alias uniqueness, category order, unique IDs, intent coverage, compatibility constraints, fixtures, secret declarations, safety policy, and reproducibility by building twice in clean environments and comparing `contentSha256` and `artifactSha256`.

## 4. Build, release, and Control Plane

### 4.1 Signed Woodpecker entry points

Only signed Woodpecker runs from repository `vivekrto9/astropages-skills-factory` are trusted. The exact pipeline-purpose allowlist is:

- `skills_ci`
- `skills_release`

Repository identity and purpose must both match exactly. Branch name, actor, commit message, artifact URL, or possession of a bundle alone does not grant release authority. The Control Plane verifies the configured Woodpecker signing identity, repository, pipeline purpose, source commit, manifest `contentSha256`, external tar `artifactSha256`, and attestation freshness. Unknown repositories, purposes, signatures, or digest mismatches fail closed.

PR and all non-`main` runs execute `skills_ci`. A `main` run executes `skills_release`; it must not publish from any other ref. `skills_ci` may validate and report but cannot create a releasable Control Plane build. The `skills_release` publisher receives only a dedicated Control Plane callback URL and narrowly scoped callback token. It can submit the signed bundle identity and register an immutable candidate; it cannot choose public version/notes, read other Control Plane data, or move the current pointer. When accepting a candidate, Admin assigns the DB-owned semantic release version by an explicit `patch`, `minor`, `major`, or `custom` choice and supplies the release notes/changelog. Admin then separately promotes the current pointer under operator authorization.

### 4.2 Immutable data model

The Control Plane owns these persisted concepts:

- **`builder_skill_builds`:** immutable build tuple of source commit, toolchain identity, manifest `contentSha256`, external tar `artifactSha256`, signature/attestation, and validation result.
- **`builder_skill_releases`:** immutable release referencing exactly one successful build plus the Admin-assigned, DB-owned semantic version, version-choice mode (`patch`, `minor`, `major`, or `custom`), release notes/changelog, compatibility policy, and public catalog snapshot used by Client and inference.
- **`builder_skill_release_events`:** append-only audit events for candidate acceptance, version/notes assignment, promotion, rollback, and other release lifecycle decisions. The exposed resource name is exactly `release_events`; no alternative event resource name is permitted.
- **Current pointer:** mutable reference keyed by `(environment, channel)`, where channel is exactly `stable` or `canary`, to one row in `builder_skill_releases`.
- **`builder_chat_sessions.skill_release_id`:** immutable conversation pin to one release after its first assignment.

Artifacts are stored by digest. Registering an existing digest is idempotent; conflicting metadata for a known digest is rejected. A release can never be overwritten, and deleting a release referenced by a pointer or conversation is prohibited.

Admin promotes or rolls back the `stable` and `canary` pointers independently. Each operation is an audited compare-and-swap using environment, channel, expected current release, and target release; it does not rebuild, mutate, or clone content. Existing conversation pins never change when either pointer moves.

### 4.3 Conversation pinning

Before a new conversation's first skill-aware dispatch, the server-owned `BUILDER_SKILLS_V2_ENABLED` cohort resolver selects `stable`, `canary`, or the legacy path. For a v2 cohort, Control Plane resolves the current pointer by `(environment, selected channel)` and atomically persists its release ID to `builder_chat_sessions.skill_release_id` before dispatching the request to AI. AI never resolves current itself. Every later turn uses that single persisted release, including after promotion or rollback. Retries are idempotent and cannot re-resolve to a different channel or release. A new release is adopted only by a new conversation or an explicit future migration mechanism, which is not part of v1.

If the pinned release or its verified artifact cannot be loaded, AI fails closed for skill activation and returns a recoverable service error. It must not fall forward to current, fall back to an embedded bundle, or mix skills from releases.

### 4.4 Deterministic intent selection

Control Plane owns deterministic intent inference against the pinned release's public catalog snapshot. Catalog validation rejects collisions among NFKC/lowercase-normalized intent keys, labels, and aliases. Inference normalizes the user's text with Unicode NFKC and lowercase, then matches only exact word-boundary occurrences of those keys, labels, or aliases; partial-substring matches are forbidden. An explicit user intent/action is authoritative after pinned-catalog validation and is not overridden by inference. Without an explicit user intent/action, a matched intent is high-confidence only when produced by that exact normalized word-boundary rule. Up to three distinct matches can be high-confidence and are returned in deterministic catalog order. Any ambiguous catalog or routing state asks the user to clarify and assigns no activation marker. When there is no explicit or high-confidence inferred intent, AI uses native OpenHands progressive discovery; it still loads only the pinned release and cannot bypass its catalog/tool constraints.

## 5. Admin boundary

Admin is a release operations surface. Authorized operators may list builds/releases, inspect validation and evaluation evidence, accept a candidate by choosing `patch`, `minor`, `major`, or `custom` semantic version and supplying release notes/changelog, promote a release, roll back to an eligible release, and view an immutable audit log.

Admin cannot create, edit, upload, patch, reorder, or delete categories, intents, skills, manifests, or bundle files. It cannot change a conversation pin. Content changes return to the factory review and signed release path. Promotion and rollback require least-privilege authorization, an expected-current value, a reason, and an audit event containing actor, source and target release, environment, timestamp, and request correlation ID.

## 6. AI loader and activation

AI uses OpenHands SDK 1.24 and a verified pinned loader. Control Plane dispatches the persisted `skill_release_id`; AI rejects a continuation whose supplied release differs from the release already bound to that conversation. The loader downloads the pinned artifact through an authenticated Control Plane internal endpoint and verifies the requested release ID, external tar `artifactSha256`, manifest `contentSha256`, every per-file `sha256`, allowed path set, schema/runtime compatibility, and absence of symlinks before extraction. It atomically extracts exactly to `/app/agent_skills/releases/<release-id>` on shared named storage, and mounts that release read-only into the sandbox. No alternate extraction root, partial directory, mutable overlay, or cross-release load is allowed. Cache keys include the release ID and `artifactSha256`; cached content is reverified before use.

Activation uses OpenHands `KeywordTrigger`. Ordinary discovery remains progressive: the router can surface categories, infer granular intents, and ask for clarification. For an authoritative explicit user intent/action or a deterministic high-confidence inferred intent, AI resolves the pinned catalog mapping to internal `Skill` objects, programmatically assigns a collision-resistant unique marker to each object's `KeywordTrigger`, and appends those markers to the outgoing OpenHands message. This guarantees activation without calling an internal skill a user selection. Markers are generated per resolved object, cannot collide with normal text or one another, are not accepted from Client, and are removed from user-visible output and telemetry text. Only internal skills and tool dependencies declared by the effective pinned intent/action mapping may be resolved. Ambiguous or low-confidence routing asks for clarification and receives no guaranteed marker.

Loaded skill instructions are untrusted content with respect to system policy. They cannot raise privileges, bypass tool approvals, access undeclared secrets, alter the release pin, or override platform/system instructions. Loader and activation events record conversation, release, skill ID/version, intent, and outcome without recording secret values.

## 7. AstrologyAPI MCP at builder time

AstrologyAPI MCP is a server-only, conversation-scoped source of discovery and implementation intelligence. It lets AI inspect the official MCP tools, API capabilities, inputs, and schemas needed to generate a correct server-side runtime integration for the site being built. The browser never receives its credentials, transport endpoint, raw tool registry, or unrestricted invocation access. Control Plane supplies only enablement. The AI service receives `ASTROLOGYAPI_MCP_ENABLED`, `ASTROLOGYAPI_MCP_URL`, and `ASTROLOGYAPI_MCP_KEY` only from trusted AI deployment secret/environment management; key rotation is an AI deployment operation. The AI proxy reads URL/key configuration in service memory and adds `x-astrologyapi-key` only to the outbound MCP request. It never injects the key into the OpenHands environment, skill content, conversation/request payloads, telemetry, or Control Plane. AI attaches MCP only when the effective pinned intent/action mapping declares that dependency, scopes it to that conversation and pinned release, applies policy, timeouts, and rate limits, and closes it on conversation expiry. This platform credential configuration is part of Builder Skills v1 and not Task 11.

MCP results help the builder implement an Astrology Experience against supported runtime APIs; MCP itself is not the generated site's runtime or an end-user proxy. Generated runtime calls are server-side, bind the existing Project Secret `X_ASTROLOGYAPI_KEY`, and follow the inspected official contract. Tool output is treated as untrusted data and validated before it influences generated artifacts.

## 8. Project Secrets and unsupported integrations

Secrets belong to the existing server-side Project Secrets facility. Skill content may refer only to logical secret names declared in `astropages/secrets.manifest.json`; it must never include values, provider tokens, or instructions to place secrets in browser code. Each entry declares the required keys and may include a validated HTTPS `documentationUrl`; it contains no value or ciphertext.

For a supported integration, Client gathers or selects credentials through the Project Secrets UI, the server stores them, and runtime code receives only server-side references under existing authorization. AI can determine presence/status but cannot read secret values.

For an integration not already supported by the bundle, the skill must use this fixed implementation flow:

1. Research the official vendor documentation with browser/web access; do not rely on model memory, third-party tutorials, or invented endpoints.
2. Design and implement the integration server-side using the official authentication and API contract.
3. Add its required secret keys and optional validated HTTPS `documentationUrl` to `astropages/secrets.manifest.json`; reject non-HTTPS, malformed, or unrelated documentation URLs.
4. Sync the manifest and generated project changes in one exact generated-repository commit so code and required keys cannot drift from one another.
5. When secrets are absent, render a safe missing-secret preview that performs no live call and expose a Setup card linking directly to Project Secrets.
6. Create no secret fields outside Project Secrets and write no credential into generated code, chat, logs, previews, or analytics.

If official documentation is unavailable, contradictory, unsafe, or outside supported server capabilities, stop implementation and return an actionable unsupported state instead of fabricating a connector. Missing required secrets block only live behavior for the affected integration; its safe preview and Setup card remain available without exposing values or corrupting unrelated builder work.

## 9. Adaptive hybrid Client UX

The Client uses an adaptive hybrid interaction rather than a permanent catalog or chat-only flow:

- default entry is natural-language builder chat;
- a grouped `@` picker and a Skills button provide explicit user intent/action selection, grouped by the 11 public categories;
- when intent is broad, ambiguous, or exploratory, the UI shows the 11 public categories as compact suggestions;
- after category selection, it presents relevant granular actions progressively, not internal skill names;
- when intent confidence is high, it proceeds directly while showing the chosen action and allowing correction;
- an explicit user intent/action displays a `Using` indicator, while a deterministic high-confidence inferred intent/action displays an `Auto` indicator;
- skill, secret, unsupported-integration, loading, retry, and completion states are rendered from structured server events;
- keyboard access, screen-reader labels, responsive layout, and reduced-motion behavior are acceptance requirements.

The server remains authoritative for release pinning, intent eligibility, activation, secrets, and tool access. An explicit user intent/action from the pinned public catalog is authoritative after Control Plane validation; an inferred `Auto` intent/action cannot override it. Client-supplied release, completion, internal-skill, or tool values are untrusted hints. The UI must not enumerate internal skills or permit an intent/action outside the pinned release.

## 10. Security and trust boundaries

The principal boundaries are:

1. **Factory authors to signed CI:** reviewed source is untrusted until schema, policy, test, and reproducibility checks pass.
2. **Woodpecker to Control Plane:** only verified attestations from the exact repository and purpose allowlist may validate or register candidates; only Admin creates the DB-owned release record.
3. **Admin operator to Control Plane:** operators may move audited pointers but cannot mutate content or pins.
4. **Client to server:** all client claims are untrusted; authorization and validation occur server-side.
5. **Control Plane artifact to AI:** digest and manifest verification precede loading; content remains subordinate to system policy.
6. **AI to AstrologyAPI MCP:** server-only, least-privilege, conversation-scoped discovery/implementation intelligence with validation and bounded lifetime.
7. **Generated project to Project Secrets:** generated browser code gets no secret values; integrations use server-side references only.

All services use least-privilege identities, encrypted transport, bounded payloads, timeouts, and structured audit events. Logs and evaluation corpora prohibit secrets and minimize user content. Bundle parsing, archive extraction, trigger input, MCP output, and generated structured events are size-limited and schema-validated. Release verification, authorization, and secret-boundary failures fail closed.

## 11. Evaluation, canary, and release acceptance

A release is eligible for promotion only when all required evidence is attached to its immutable build:

- deterministic build and signature/attestation checks pass;
- schema, taxonomy, safety, secret-manifest, loader compatibility, and unit/integration suites pass;
- golden intent-routing tests cover NFKC/lowercase normalization, exact word boundaries, explicit precedence, the three-intent cap, no partial-substring matches, and native OpenHands fallback; KeywordTrigger tests meet the versioned threshold with no critical category regression;
- adversarial prompt-injection, path traversal, archive bomb, signature/repository spoofing, secret exfiltration, and cross-conversation isolation tests pass;
- representative end-to-end builder tasks pass for every public category, including accessibility and structured error states;
- latency, artifact size, token cost, and failure-rate budgets are within the release policy;
- a human reviewer accepts content quality and the release owner records the decision.

Canary promotion moves the environment's `canary` current pointer and the cohort resolver sends only a limited, explicitly defined set of **new conversations** to that channel. Existing conversations retain their pins. Telemetry is compared with the `stable` channel for activation accuracy, task completion, clarification rate, errors, latency, cost, unsupported-integration rate, and safety events. Any security boundary violation, secret exposure, invalid artifact, cross-conversation access, or severity-1 regression triggers an immediate CAS rollback of the `canary` pointer and blocks wider promotion. Other thresholds are versioned in release policy and evaluated automatically.

General promotion requires the canary observation window and sample minimum to pass, no unresolved release-blocking issue, and an authorized audited approval. Admin then CAS-updates the environment's `stable` pointer. Rollback changes the affected channel pointer, with CAS and an audit event, to either its explicit previous pointer or an operator-selected eligible last-known-good release. The target must differ from the current faulty release; a no-op rollback is rejected. Rollback protects newly pinned conversations without changing existing pins. Handling an already pinned faulty conversation is an operational incident flow, not silent repinning.

## 12. Feature flag, cutover, and legacy removal

The server-owned `BUILDER_SKILLS_V2_ENABLED` flag controls cohort eligibility and resolves each new conversation once to legacy, `stable`, or `canary`; only v2 channels resolve a current pointer and persist a release pin. Client UI is driven by server capability state, not an independent security decision. Rollout proceeds disabled, internal, canary, staged, then general availability. Each stage has an explicit owner, observation window, acceptance evidence, and rollback target. Enabling or changing production cohorts is a production mutation and requires explicit authorization.

During migration, the legacy path may coexist behind the inverse cohort decision, but a single conversation uses exactly one path for its lifetime. No request may merge legacy and v1 skill content. Telemetry distinguishes both paths and supports outcome comparison.

Legacy removal occurs only after general availability is stable for the documented deprecation window, rollback no longer depends on legacy, all active legacy conversations have expired or an approved handling policy, operational runbooks are complete, and repository-wide references and tests are removed. Flag deletion is last. Re-enabling legacy after removal requires a new change, not a hidden switch.

The discarded `astropages-capabilities` repository may be consulted as research history only. It is never a source of authored skills, catalog data, runtime content, release artifacts, or fallback behavior, and no build or service may depend on it.

## 13. Milestone plan (0–10)

0. **Grounding and documentation:** approve architecture, scope, invariants, repository SHAs, worktrees, and the durable ledger. This milestone completes only when specification status and quality review are both `APPROVED`.
1. **Audit and baselines:** audit repository templates, existing integration/secrets flows, dependencies, native tests, and baseline evidence.
2. **Factory plus three slices:** implement the deterministic `dist/bundle` contract and validate it through three representative end-to-end category/intent/skill slices.
3. **Control Plane:** implement `builder_skill_builds`, `builder_skill_releases`, `builder_skill_release_events`/`release_events`, public catalog snapshots, DB-owned versions/notes, current pointers, pre-dispatch `builder_chat_sessions.skill_release_id`, deterministic inference, authorization, and audit.
4. **Woodpecker:** implement signed PR/non-main `skills_ci` and main-only `skills_release`, exact repository/purpose verification, dedicated callback credentials, and candidate registration.
5. **Admin:** implement candidate review, version/notes assignment, promotion, rollback, and immutable evidence views without content editing.
6. **AI:** implement continuation pin enforcement, authenticated verified extraction to shared `/app/agent_skills/releases/<release-id>` storage, OpenHands SDK 1.24 native fallback, guaranteed unique-marker `KeywordTrigger` activation, and structured events.
7. **Client:** implement adaptive hybrid discovery, grouped `@` picker, Skills button, `Using`/`Auto` states, Setup cards, accessibility, and `BUILDER_SKILLS_V2_ENABLED` behavior.
8. **MCP and integrations:** implement dependency-gated AstrologyAPI MCP with the exact AI environment variables, official-doc server-side Project Secrets flows, generated-repository commit sync, and `X_ASTROLOGYAPI_KEY` runtime binding.
9. **Expand:** extend the validated slices across all approved categories/intents, complete evaluation coverage, and meet release acceptance thresholds.
10. **Cutover and removal:** perform authorized production canaries, staged release/cutover, rollback drills, stability gates, and legacy removal.

Completion of a milestone means its scoped code, tests, security checks, documentation, and review evidence are present. Milestone 10 is not complete until its authorized production canary, cutover, stability, and removal gates have actually passed.
