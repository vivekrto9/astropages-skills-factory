---
name: responsive-accessibility-and-performance
description: Use this skill when a user wants frontend work or a quality audit that affects viewport behavior, keyboard or assistive access, motion, or loading, including quality needs implicit in visual changes; not for server-only changes with no user-facing impact.
---

# Verify Cross-Cutting UI Quality

Treat responsive behavior, accessibility, motion safety, and performance as observable behavior rather than styling claims.

1. Test representative narrow, medium, and wide viewports; prevent overflow and preserve readable line lengths, touch targets, and content order.
2. Use semantic landmarks and controls. Verify keyboard order, visible focus, labels, current state, errors, and screen-reader names.
3. Honor reduced motion and avoid interaction that depends only on hover, animation, color, or pointer precision.
4. Preserve progressive enhancement. Keep essential content and actions available when optional client scripts fail.
5. Measure before claiming a performance improvement. Avoid needless client JavaScript, layout shifts, oversized media, or speculative rewrites.
6. Run focused checks for the changed surface, inspect it in a browser, then run the project's full verification contract. Report any untested device, assistive-technology, or performance limit.
