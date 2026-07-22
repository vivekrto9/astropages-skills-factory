---
name: charts-transits-synastry-and-compatibility
description: Use this skill when a user wants natal charts, transit forecasts, synastry, or compatibility experiences, including interpretation and comparison states around provider-backed results; not for generic data charts or provider-contract discovery alone.
---

# Present Chart-Based Experiences Truthfully

1. Inspect the target astrology adapter, input validation, stored birth data, timezone/location handling, response schema, consent/privacy boundary, existing chart components, and tests.
2. Confirm the exact requested experience and implement the smallest domain UI around fields supplied by the verified adapter. Keep provider transport and capability discovery in the provider-adapter boundary.
3. Preserve person, date, local time, timezone, coordinates, chart system, and comparison order through validation, cache, persistence, and display. Do not guess missing birth inputs.
4. Separate invalid input, missing configuration, provider failure, no data, partial result, and success. Do not invent placements, aspects, scores, interpretations, certainty, or relationship claims.
5. Test input boundaries, swapped persons, privacy/authorization, partial responses, accessible chart alternatives, and sanitized fixtures.

Report the observed response contract, verification evidence, and calculation or interpretation limitations. Do not claim provider accuracy or live success without controlled proof.
