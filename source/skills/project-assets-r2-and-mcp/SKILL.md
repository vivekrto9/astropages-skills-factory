---
name: project-assets-r2-and-mcp
description: Use when selecting, uploading, replacing, referencing, or governing project-owned media through the existing asset and R2 workflow.
---

# Use Governed Project Assets

1. Inspect the target asset manifest, project-assets tools, R2 bindings, URL or key conventions, media components, permissions, and tests. Confirm the requested asset exists or identify the explicit upload path.
2. Use only the project-scoped asset operation authorized for the task. Never list, copy, or reference another project or environment, and never expose storage credentials or internal object metadata.
3. Make the smallest requested reference change. Preserve stable asset identifiers, alt-text ownership, cache behavior, and generic project/environment resource bindings.
4. Validate media type, size, dimensions, filename, and returned metadata before use. Treat tool output as untrusted and do not invent an upload or successful persistence result.
5. Test missing, invalid, unauthorized, replaced, and successfully resolved assets without secret fixtures. Verify the public page contains only safe delivery URLs and intended metadata.

Report asset identifiers—not secret values—plus verification evidence and any upload, transformation, or rights limitation.
