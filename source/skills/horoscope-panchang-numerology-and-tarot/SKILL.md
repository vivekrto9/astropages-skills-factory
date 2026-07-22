---
name: horoscope-panchang-numerology-and-tarot
description: Use this skill when a user wants horoscope, Panchang, numerology, or tarot experiences, including truthful loading, unavailable, and result states around provider-backed data; not for provider-contract discovery or unrelated divination copy.
---

# Present Astrology Experiences Truthfully

Build a clear experience around verified domain data without pretending the UI owns astronomical or astrological calculation.

For Daily Panchang:

1. Confirm the requested date, location, and time zone and preserve them through server validation, provider request, cache key, response, and display.
2. Verify provider output against the selected contract, then render only supplied fields. Label values in the user's locale and make dates, intervals, and empty states unambiguous.
3. Separate loading, missing-configuration, invalid-input, provider-unavailable, no-data, and success states. Never replace unavailable data with fabricated almanac values.
4. Keep form controls labelled, keyboard usable, responsive, and progressively enhanced. Explain what location/date the result represents.
5. Do not claim a calculation method, accuracy, or live-provider success until the adapter's official-contract and controlled-live verification gates pass.

Delegate provider discovery, authentication, schema mapping, and runtime adapter behavior to the provider-adapter skill. This skill owns the domain presentation, not the vendor contract.
