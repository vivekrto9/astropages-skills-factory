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

Status: **Milestone 0 complete; Milestone 1 in progress**

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

Milestone 1 is not complete: native repository/service baselines, dependency/integration/secrets-flow baselines, source-level parity review, and the final granular-intent/internal-skill inventory remain outstanding.

Next action: complete Milestone 1 baselines and inventory without converting research family labels or legacy capability declarations into factory architecture.

## Milestone index

0. Grounding and documentation — **complete**
1. Audit and baselines — **in progress** (audit part 1 complete; baselines and inventory remain)
2. Factory plus three slices
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
