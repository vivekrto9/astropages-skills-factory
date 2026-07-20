# Provider Verification Gates

Use these gates after choosing an official MCP capability:

- Save no credential or raw provider payload in generated fixtures, logs, chat, analytics, or source.
- Prove the target repository's current server-side secret resolver supplies the reserved catalog-managed `X_ASTROLOGYAPI_KEY` binding. Do not declare it in the project secret manifest or invent a direct environment lookup.
- Check required inputs, ranges, dates, locations, time zones, and response discriminants at the server boundary.
- Test missing configuration, invalid input, provider rejection, timeout, malformed response, and success mapping with sanitized fixtures.
- Perform a controlled live call only when the environment authorizes it. Compare documented inputs and returned fields; record the check without credential or personal data.
- Describe results as provider-returned data. Claim a calculation system, ayanamsa, precision, or domain accuracy only when the inspected official contract and controlled verification prove it.
- Keep the UI honest when live verification is not available: label the limitation and do not manufacture a success state.
- When the catalog binding is absent, exercise the structured integration-not-ready path and confirm that no live provider call occurs. Leave credential setup and linking to platform-owned integration surfaces.
