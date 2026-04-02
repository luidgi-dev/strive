# components/

Reusable React components organized by responsibility.

## Structure

- `forms/` — Authentication and data entry forms
- `ui/` — Primitives (buttons, inputs, modals, etc.)

## Naming

- Component files use PascalCase: `LoginForm.tsx`
- One component per file unless composing micro-components
- Prefer Server Components by default
- Only add `"use client"` for interactive features