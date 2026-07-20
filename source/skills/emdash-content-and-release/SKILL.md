---
name: emdash-content-and-release
description: Use when editing governed site content, adding editable structures, or operating the generated site's existing content release lifecycle.
---

# Keep Content Governed by EmDash

1. Inspect collections, field definitions, locales, bootstrap code, EmDash handlers or tools, release tracking, and public/preview reads. Confirm which path owns the requested content.
2. Make the smallest requested content change through the existing EmDash mutation path. Never write raw D1 updates or introduce a parallel JSON or code-owned content source.
3. Keep public render and `?preview=1` read-only: rendering must not create schema, entries, drafts, bootstrap rows, or release revisions.
4. Preserve content-release semantics: record real edits only, use `contentHash` for public-content equality, and keep `snapshotHash` tied to the exact approved preview snapshot. Do not mix preview and production data.
5. Test bootstrap explicitly, read-only renders, edits, previews, locale fallbacks, release creation, and no-op changes. Run focused content tests before the repository contract.

Report the mutation path used, release evidence, and unresolved schema or publication limitations. Do not claim publication from a local content edit alone.
