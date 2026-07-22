---
name: localization-and-locale-lifecycle
description: Use this skill when a user wants another language or locale-aware behavior, including translated content, routes, formatting, selection, and fallback lifecycle; not for a copy edit that stays in one existing locale.
---

# Implement Locale Lifecycle

1. Inspect current locale configuration, EmDash locale fields, route strategy, fallback rules, formatters, language switcher, metadata, and tests. Confirm whether translations are supplied or require user review.
2. Add the smallest requested locale surface using existing route and content conventions. Preserve stable content identifiers and do not duplicate the content model per language.
3. Keep translation truth explicit: never invent legal, medical, commercial, or astrology claims. Mark missing translations and use the documented fallback rather than silently mixing languages.
4. Localize navigation, dates, times, numbers, directionality, canonical/alternate metadata, validation, and empty states where applicable. Keep public rendering read-only and edits in EmDash.
5. Test locale detection, direct URLs, switching, fallback, missing content, formatting, and keyboard use. Verify no locale creates duplicate or broken canonical routes.

Report covered locales, test evidence, fallback behavior, and text still requiring human translation or review.
