---
name: analytics-events-and-business-insights
description: Use this skill when a user wants to measure behavior, conversions, funnels, or business outcomes, including dashboards implied by a request for performance insight; not for runtime performance profiling or operational logs alone.
---

# Measure Defined Business Events

1. Inspect existing analytics providers, consent gating, event conventions, public actions, data schema, read-only analytics manifest, and tests. Confirm the decision each requested metric should support.
2. Define the smallest event set with stable names, trigger semantics, allowed properties, owner, and deduplication rule. Do not send content, identity, location, chart data, or credentials unless explicitly necessary and permitted.
3. Keep collection consent-aware and server/client boundaries consistent with the target. Analytics SQL must be read-only and reference only tables created by that site's migrations.
4. Build insights from traceable numerator, denominator, time range, and filters. Show empty, delayed, partial, and unavailable states rather than fabricating trends.
5. Test consent off/on, one event per action, schema rejection, retries or duplicates, query bounds, and empty data. Verify emitted payloads and calculations with fixtures.

Report definitions, privacy decisions, test evidence, and data-latency or attribution limitations. Do not claim business impact from instrumentation alone.
