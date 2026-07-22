---
name: integrations-webhooks-automation-and-consent
description: Use this skill when a user wants a verified external-provider action, webhook, automation, or consent-aware data exchange, including workflows implied by moving data between systems; not for researching an unknown vendor contract by itself.
---

# Implement Integration Mechanics

Translate the recorded official contract into a real, bounded connector rather than setup-only scaffolding.

1. Keep server-side authentication, request handling, and response handling together. Validate and minimize browser input before invoking the provider.
2. For every public mutation endpoint, inspect the target repository's existing CSRF and origin checks, spam and abuse defenses, rate-limit behavior, duplicate-submit handling, and idempotency conventions. Reuse proportionate controls for that public mutation endpoint instead of adding a parallel security stack.
3. Isolate the provider client behind a narrow typed interface. Bound timeouts, response size, retries, rate handling, and error mapping; do not retry unsafe operations without an idempotency strategy.
4. When the verified official contract includes webhooks, implement the strongest officially documented authenticity and replay controls it supports. Do not invent a signature format, timestamp rule, event ID, retry behavior, or ordering guarantee. If authenticity cannot be established, return an actionable unsupported state and do not accept the webhook.
5. Make consent, retention, and deletion behavior conditional on the verified data purpose, provider contract, applicable existing policy, and requested scope. Collect no unrelated fields, and do not create broad policy or database work that the bounded integration does not require.
6. Test validation, missing configuration, transport/provider failures, and a sanitized success fixture. Test relevant existing mutation defenses. Test webhook forgery, replay, and idempotency only against controls proven by the official contract; test consent or lifecycle behavior only when the bounded contract requires it.
7. Run a controlled sandbox or live check only with authorization. Report mocked and live evidence separately; without live evidence, do not claim provider success.

Do not modify a template-wide deployment secret allowlist for a project-local connector. Use the existing Project Secrets manifest and readiness flow.
