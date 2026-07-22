---
name: research-external-integrations
description: Use this skill when a user requests an external provider whose current official authentication or API contract is unknown or unsupported, including implicit vendor research needs; not for an already verified supported integration.
---

# Research an Unbundled Provider

Treat current official vendor documentation as the only authority for a new connector. Do not implement from model memory, a third-party tutorial, search snippets, or an SDK name alone.

1. Confirm the provider and exact user outcome. Search official domains for the current API/version, authentication, permissions, endpoints or SDK methods, request/response schemas, limits, webhook verification, privacy requirements, and test environment.
2. Record evidence using [the official-contract record](references/official-contract-record.md). Distinguish facts read from official material from implementation inferences.
3. Check that the generated site's server runtime and existing Project Secrets flow can satisfy the contract. Bound scopes and retained data to the requested outcome.
4. Hand verified mechanics to the integration skill and credential declarations/readiness to the runtime-config skill.
5. If official documentation is unavailable, contradictory, unsafe, paywalled beyond verification, or incompatible with the runtime, stop with an actionable unsupported state naming what is missing and what would unblock it.

Research does not equal implementation or provider success. Require code, tests, safe setup behavior, and authorized live verification before claiming the connector works.
