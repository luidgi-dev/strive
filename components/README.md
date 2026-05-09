# `components/`

Reusable React components, organized by responsibility.

## Structure

- `forms/` — Authentication and data-entry forms (`login-form`, `sign-up-form`, `forgot-password-form`, `update-password-form`, `logout-button`)
- `landing/` — Landing page sections (`hero-section`, `philosophy-section`, `vocabulary-section`, `ai-conversation-section`, `ritual-visualization-section`, `landing-shell`, `landing-footer`) plus `index.ts` (barrel export) and `types.ts` (shared props types)
- `providers/` — React context providers (`theme-provider`)
- `ui/` — Primitives from shadcn / Base UI (`button`, `card`, `input`, `label`, `locale-switcher`, `theme-toggle`)

## Conventions

- **Filenames** are kebab-case (`login-form.tsx`).
- **Component identifiers** stay PascalCase (`LoginForm`).
- One component per file unless composing tightly-coupled micro-components.
- **Server Components by default**; only add `"use client"` for hooks, browser APIs, or interactivity.
- User-facing strings go through `next-intl` — add keys to [`messages/en.json`](../messages/en.json) and [`messages/fr.json`](../messages/fr.json), never inline.
