# Current Builder Skills and Project Secrets Flow — 2026-07-20

Status: Milestone 1 current-flow audit complete; source evidence only, not a v1 skill inventory or implementation proposal

## Audit boundary

This audit read the Builder Skills v1 architecture, implementation ledger, template audit, and no-skill baselines, then inspected the current source at these unchanged checkpoint commits:

| Repository | Commit | Worktree |
|---|---:|---|
| Control Plane | `1e5d853` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-control-plane-service/builder-skills-v1` |
| Client | `a4598c6` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-client/builder-skills-v1` |
| AI | `4367751` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-ai-service/builder-skills-v1` |
| Admin | `c9593c5` | `/Users/alokprasad/.config/superpowers/worktrees/astropages-admin/builder-skills-v1` |

All four source worktrees were clean. This pass did not run services, pipelines, provider calls, or deployments and did not inspect the external worker behind `BUILDER_CHAT_SKILLS_WORKER_BASE_URL`. Admin has no current Builder Chat skill registry, project-secret, or Builder Skills release surface relevant to this flow.

## 1. Current Builder Chat skill registry and session pin

The Control Plane owns the current registry. `database/ddl/001_initial_schema.sql` and `database/ddl/004_builder_chat_skill_registry.sql` define:

- `builder_chat_skills`: stable `key`, mutable `current_version_id`, and `active`/`removed` status.
- `builder_chat_skill_versions`: integer version, display name, `openhands_skill_name`, upstream `hash`, and local `definition_hash`, unique by `(skill_id, version)` and `(skill_id, hash)`.
- `builder_chat_sessions.skill_snapshot`: a non-null JSON array. It stores the active version records at session creation, including skill/version IDs, key, name, OpenHands skill name, version, hash, and active status.

`src/repositories/builder-chat-skills.ts` appends a version when a definition's resolved hash changes, moves `current_version_id`, reactivates returned skills, and marks keys absent from a successful manifest sync as removed. `src/services/builder-chat.ts#createBuilderChatSession` resolves the active registry and passes the complete records to `src/repositories/builder-chat.ts#createBuilderChatSession`; later turns read that persisted snapshot. There is no release/build/current-pointer model and no `builder_chat_sessions.skill_release_id` today.

The skill-selection/session-message routes relevant to this audit are:

- `POST /projects/:projectId/builder-chat/sessions`
- `GET /projects/:projectId/builder-chat/skills`
- `GET /projects/:projectId/builder-chat/sessions/:builderChatSessionId/skills`
- `POST /projects/:projectId/builder-chat/sessions/:builderChatSessionId/messages`

For an existing session, `listBuilderChatSkills` keeps snapshot skills selectable even if their current registry row changed or was removed. A current key not in the snapshot is returned as `new_conversation_required`, badge `New`, and disabled reason `Available in new conversations.` A hash change produces the same conversation-update notice but does not expose the newer version in that session.

### Worker-manifest synchronization and fallback

The exact current synchronization owner is the **Control Plane**. `src/services/builder-chat-skill-sync.ts#resolveActiveBuilderChatSkills` performs an on-demand pull whenever the catalog is listed or a session is created:

1. If `BUILDER_CHAT_SKILLS_WORKER_BASE_URL` is set, it requests `GET {base}/skills/manifest`, using `BUILDER_CHAT_SKILLS_WORKER_BEARER_TOKEN` or, secondarily, `OPENHANDS_BEARER_TOKEN`.
2. It accepts only manifest entries with non-empty `key`, `name` (or key fallback), and `hash`; it sets `openhandsSkillName` equal to the key.
3. `syncBuilderChatSkillsFromManifest` versions changed hashes and marks missing keys removed.
4. If no worker base URL is configured, or the request/sync throws, `ensureDefaultBuilderChatSkills` runs. It inserts the nine hard-coded definitions from `src/services/builder-chat-skills.ts` only when the registry table is empty; otherwise it returns the currently active DB rows.

This is request-time pull synchronization, not a signed publication or background release operation. The audited AI service has no `/skills/manifest` route, so the upstream worker implementation and its content ownership are outside these worktrees. A previously populated registry is the failure fallback; hard-coded definitions are only the empty-registry seed.

## 2. Selection validation and current propagation

Client sends only `{ key }` entries in `selectedSkills`. `src/services/builder-chat-skills.ts#normalizeSelectedBuilderChatSkills` requires an array, accepts strings or objects with a key, trims keys, removes duplicates, rejects empty entries, and rejects every key absent from the session's persisted `skill_snapshot`. The Control Plane then enriches accepted keys with snapshot name, `openhandsSkillName`, version, and hash. Public request/message metadata omits the internal OpenHands name.

The selected records flow through `src/services/builder-chat.ts#buildProjectContext`, the persisted Builder Chat plan, and `src/repositories/builder-chat-orchestration.ts#selectedSkillsFromPlan` into the generated `change_specs.spec`. `src/services/openhands.ts#buildOpenHandsPrompt` then:

- sanitizes the change-spec copy to selected key/name only;
- writes those keys into a `Selected OpenHands agent skills` prompt section; and
- instructs the agent to use them.

No selected skill IDs, version IDs, hashes, OpenHands `Skill` objects, `KeywordTrigger` markers, or release identity are sent as a structured AI activation contract. Current selection is therefore **validated against a conversation snapshot but propagated to AI as prompt text only**. AI independently loads all discoverable project/shared skills described below.

## 3. Current Client behavior

`src/components/dashboard-chat-client.tsx` and `src/lib/builder-chat-client.ts` implement an ungrouped `@` mention picker:

- typing `@` followed by letters, digits, underscore, or hyphen filters current skill key/name and shows at most six choices;
- choosing an available skill removes the typed mention from the prompt and adds an `@Name` composer chip;
- chips are removable and are rendered again above the persisted user message from metadata;
- selected keys are sent with the message and cleared after a successful submission;
- `new_conversation_required` entries are disabled and show their reason and `New` badge.

When the server returns `skills_updated`, the Client shows a dismissible notice with a new-chat button. `handleCreateSession` may reuse an existing message-free session; otherwise it creates a session, clears selected skills for the new session, and refetches its pinned catalog. Reuse means this action does not strictly guarantee a newly resolved snapshot if an older empty session exists. Session switching refetches that session's catalog. Selection state is in React memory by session/draft key and is not restored from composer-draft storage.

Current gaps versus v1 are the absence of public categories, granular intent/action objects, grouped browsing, a Skills button, broad-intent suggestions, and `Using`/`Auto` indicators. The current UI exposes legacy registry skill names directly rather than separating public actions from internal skills.

## 4. Current AI shared-skill loader and EmDash MCP proxy

The AI runtime is already pinned to OpenHands SDK `1.24.0`: `pyproject.toml` pins `openhands-sdk`, `openhands-tools`, `openhands-workspace`, and `openhands-agent-server`; configuration defaults to `ghcr.io/openhands/agent-server:1.24.0-python`.

The current shared skill path is image/volume based:

- `Dockerfile.local` copies `workspace/agent_skills` to `/app/agent_skills`.
- `docker-compose.local.yml` mounts named volume `astropages-openhands-agent-skills` at `/app/agent_skills`; a fresh volume is seeded from the image.
- sandbox creation in `src/ai_service/openhands_adapter.py` mounts that named volume at `/workspace/agent_skills:ro` (or uses configured host-directory mounts).
- `_load_project_agent_context` calls the SDK workspace method `load_skills_from_agent_server` with `[project_root, *agent_skill_dirs]`, `load_project=True`, and public/user/org loading disabled.

Thus the sandbox view is read-only, but the shared corpus is mutable deployment state seeded from the service image/named volume. It is not downloaded or verified per conversation, not release-addressed, and not isolated under `/app/agent_skills/releases/<release-id>`. Loader failure or a missing SDK method logs and returns `None` rather than failing closed. The committed `workspace/agent_skills` contains only a README at this checkpoint.

The reusable current server-side MCP pattern is `src/ai_service/emdash_mcp_proxy.py` plus `src/ai_service/openhands_adapter.py`:

- Control Plane supplies a project-specific EmDash URL and a plain or encrypted bearer token for the prompt.
- AI decrypts if necessary, holds the URL/token in an in-memory registry keyed by conversation, and persists only sanitized MCP metadata containing the URL.
- a per-conversation FastMCP proxy adds `Authorization: Bearer <token>` upstream, applies the `_rev` to `rev` compatibility transform for `content_update`, and is exposed internally at `/internal/openhands/v2/conversations/:conversationId/mcp/emdash/mcp`;
- OpenHands receives only that credential-free proxy URL in `mcp_config`; continuation without a fresh token continues without EmDash MCP and logs a warning.

This proxy/registry shape is reusable for a conversation-scoped server-only MCP dependency. Its credential source, header, policy, lifecycle, and attachment rule are EmDash-specific and do not implement the architecture's deployment-owned AstrologyAPI MCP configuration or intent-dependency gating.

## 5. Current Project Secrets contract and synchronization owner

Migration `database/ddl/035_project_secret_manifests.sql` adds one `project_secret_manifests` row per `(project_id, environment)`, recording project version, source path, parsed JSON, manifest hash, exact `source_commit_sha`, valid/invalid status, and validation errors.

`src/services/project-secret-manifest.ts` owns the current `astropages/secrets.manifest.json` schema. It accepts `version: 1`, integrations with `key`, `name`, optional `description`, and `secrets`; each secret accepts `key`, `label`, optional `helpText`, `required`, and unique preview/production environments. It rejects unknown fields and value-like fields such as `value`, `default`, `example`, `encryptedValue`, `secretRef`, and `storeId`, as well as reserved platform/catalog bindings.

`documentationUrl` is **not currently supported**: it is absent from the TypeScript interfaces and allowed-field sets, so validation reports it as unsupported; Client response types and `DashboardSecretsPage` have no documentation-link field or rendering.

The exact manifest synchronization owner is again the **Control Plane**, in `src/services/project-secret-manifest-sync.ts#syncProjectSecretManifestFromRepository`. It reads the file through GitHub at the exact `commitSha` supplied by the deployment/project version and upserts the row with that same SHA:

- preview: `src/services/project.ts#updatePreviewDeploymentStatus` calls the sync after a deployment becomes `ready`, using `updated.commitSha`; errors are swallowed and the deployment remains ready;
- production: `src/services/publish.ts` syncs from `created.deployment.commitSha` before production dispatch; an invalid manifest, or required production keys newly revealed as missing, fails the deployment dispatch.

A missing file becomes a valid empty manifest and returns `missing`; malformed/invalid input persists an invalid row whose manifest body is the empty contract. Because OpenHands is instructed to commit and push generated code plus the manifest, and Control Plane reads the manifest from the resulting deployment's exact commit, code and requirements can be correlated to one generated-repository commit. There is no independent manifest push from Client, AI, or Woodpecker.

The current authenticated Control Plane API is `GET /projects/:projectId/secrets`, `PUT /projects/:projectId/secrets/:key`, and `DELETE /projects/:projectId/secrets/:key?environment=preview|production|both`. Client exposes it at both `/dashboard/astrology-website/secrets` and `/dashboard/astrology-website/[slug]/secrets`, with navigation label `Secrets` and page heading `Secret Store`. The page surfaces manifest validation errors when invalid; it does not display valid/missing manifest status or source SHAs. It also shows capacity, required/custom groups, preview/production configured-or-missing secret status, password inputs for add/replace, deletion, and the promise that saved values are never shown again.

Secret values are bundled by environment in `ASTROPAGES_INTEGRATION_SECRETS_JSON`, serialized into the Cloudflare Secret Store secret `INTEGRATION_SECRETS_JSON` under a generated project/environment store name. `project_secret_references` stores Cloudflare references and metadata; an encrypted Control Plane shadow supports patching, capacity, and compensation. Deployment configuration receives only a `secrets_store_secrets` binding tuple of binding, store ID, and secret name.

The AI boundary is metadata-only. `src/services/project-secrets.ts#listAvailableProjectSecrets` returns only integration key/name, binding key, and configured environments. `src/services/openhands.ts` embeds that metadata in the prompt and explicitly states that values are unavailable. It does not send Cloudflare references, store IDs, encrypted shadows, or secret values. The Client can submit values to the authenticated secret API; list responses return integration/key metadata, manifest status/errors/source SHAs, and capacity, never secret values.

## 6. Current Woodpecker scope

The supported `PipelinePurpose` values in `src/interfaces/pipeline.ts` are exactly:

- `template_ci`
- `template_preview`
- `template_production`
- `generated_preview`
- `generated_production`

The signed exclusive configuration service is `infrastructure/woodpecker-ci/config-extension/` (Go). It verifies Woodpecker's signed request, allowed owner, server-side repository classification (`template` or `generated`), event, exact commit, dispatch key, HMAC authorization, purpose/class match, required IDs, and `main` for template production, then renders the central pipeline. Push/PR only yields `template_ci`; the other four purposes are authorized manual pipelines.

`infrastructure/woodpecker-ci/trusted-deployer/` is the generated-pipeline privileged module. Generated pipelines use `begin`, credential-free repository verification, trusted `deploy`, and failure callback steps; repository code does not run in the credential-bearing deployer. The stack also contains server, PostgreSQL, agent, lifecycle/verification scripts, and Nginx configuration. GitHub Actions is the configured provider fallback only after definite Woodpecker pre-dispatch rejection; ambiguous dispatch becomes `dispatch_uncertain` and does not auto-fallback.

There is no `skills_ci` or `skills_release` purpose, skills-factory repository class, skills attestation/publisher, or Builder Skills callback in the current purpose union or configuration extension.

## 7. v1 reuse and replacement boundaries

| Current element | v1 disposition |
|---|---|
| Session-time snapshot and new-conversation update UX | Reuse the conversation immutability behavior and notice pattern; replace JSON skill-record pinning with the Control Plane-owned `skill_release_id` contract. |
| Server validation of Client-selected keys | Reuse the server-authoritative boundary and deduplication/error pattern; replace legacy skill-key selection with pinned public intent/action validation. |
| Worker pull, DB versions, hard-coded fallback | Replace. v1 requires signed immutable builds/releases, stable/canary pointers, atomic pinning before dispatch, and no embedded/runtime fallback content. |
| Client `@` interaction, chips, disabled-new behavior | Reuse interaction mechanics and accessibility treatment; replace the flat internal-skill catalog with grouped categories/actions, add the Skills button and `Using`/`Auto` states. |
| OpenHands SDK 1.24 and read-only sandbox mount | Reuse. Replace image/named-volume corpus seeding and permissive loader failure with verified release-addressed loading and fail-closed pin enforcement. |
| EmDash conversation proxy | Reuse the in-memory credential proxy and credential-free OpenHands endpoint pattern; implement a separate deployment-owned AstrologyAPI target/header/policy and attach it only through pinned intent dependencies. |
| Migration 035, exact-commit manifest reader, Project Secrets UI/API, Cloudflare Secret Store, metadata-only AI view | Reuse as the Project Secrets foundation. Extend the schema/UI for optional validated HTTPS `documentationUrl`; make preview invalid-sync consequences explicit enough for the v1 structured setup/unsupported flow. |
| Woodpecker signed config extension and trusted deployer | Reuse the signature, repository classification, exact-commit authorization, central rendering, and credential separation patterns. Extend the purpose/repository/publisher model for the exact factory `skills_ci` and `skills_release` contract. |
| Admin | Add the v1 release-operations surface; no current relevant Builder Skills or Project Secrets Admin module exists to reuse. |

The remaining Milestone 1 deliverable is the granular-intent/internal-skill inventory. This audit does not define or propose that inventory.
