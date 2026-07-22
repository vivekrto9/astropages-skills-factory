---
name: diagnosis-testing-and-verification
description: Use this skill when a user reports broken, regressed, slow, or uncertain generated-site behavior or asks for proof that a change works, including unexplained failing checks; not for speculative fixes before a symptom is traced.
---

# Diagnose Before Changing Behavior

1. Inspect git status, project instructions, the failing user path, logs safe to read, relevant code, configuration names, migrations, and existing tests. Reproduce the exact symptom before proposing a cause.
2. Trace data and control flow backward to the earliest incorrect state. Form one falsifiable hypothesis at a time and gather evidence that distinguishes it from alternatives.
3. Add a focused failing regression test, then implement the smallest root-cause fix. Preserve EmDash, generic runtime variables, project/environment resources, security, SSO, and deployment contracts.
4. Verify the focused test, adjacent contracts, type checks, safety checks, and build in proportion to risk. Inspect real UI or runtime behavior when automated checks cannot prove it.
5. Keep credentials and private data out of commands, logs, fixtures, chat, and reports. Do not mask failure with fake data, broad catches, or disabled checks.

Report reproduction, root cause, changed files, exact verification evidence, and any environment, device, provider, or deployment limitation. Do not call an unexecuted check passing.
