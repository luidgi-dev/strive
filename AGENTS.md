<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UX Writing & Terminology (LUI-15)

All agents must follow `docs/UX_WRITING.md` when generating or editing:
- UI copy (labels, buttons, empty states)
- error/success messages
- onboarding text
- AI-generated messages meant for users

Canonical terms to prefer (default):
- `Ritual`
- `Momentum`
- `Logged`
- `Nailed it`
- `The Flow`

Forbidden / avoid (unless explicitly required for legacy migrations):
- `Task` / `Tasks`
- `Streak`
- `Completed`
- `Dashboard`
- `Done` used as an action label
