# components/

Reusable React components organized by responsibility.

## Structure

- `forms/` — Authentication and data entry forms
- `landing/` — Marketing landing sections (localized copy via messages)
- `providers/` — Providers (theme)
- `ui/` — Primitives (buttons, inputs, modals, etc.)

## Naming

- Component files use kebab-case
- One component per file unless composing micro-components
- Prefer Server Components by default
- Only add `"use client"` for interactive features