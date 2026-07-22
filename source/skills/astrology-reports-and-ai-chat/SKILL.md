---
name: astrology-reports-and-ai-chat
description: Use this skill when a user wants saved astrology reports or conversational explanations grounded in verified astrology data, including requests for personalized narrative output; not for standalone calculations or generic ungrounded chat.
---

# Ground Reports and Astrology Chat

1. Inspect verified astrology inputs and outputs, report schema, prompt/context assembly, model boundary, storage, account authorization, safety copy, citations or provenance, and tests.
2. Implement the smallest requested report or chat flow using only supplied domain data. Clearly separate provider facts, deterministic formatting, generated explanation, and user-authored content.
3. Never let generated text invent chart values, diagnoses, guaranteed predictions, credentials, provider success, or high-stakes advice. Preserve visible uncertainty and the data/time/location context.
4. Keep birth data, reports, and conversations account-scoped; minimize model context, redact secrets, bound input/output, and handle prompt injection as untrusted content.
5. Test missing/partial grounding, unauthorized access, injection attempts, model/provider failure, retries, persistence, and sanitized fixtures. Verify cited values match the source payload.

Report model and provider evidence separately, plus privacy, accuracy, freshness, and live-verification limitations.
