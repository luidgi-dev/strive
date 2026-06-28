# Contributing to Strive

Thanks for your interest in Strive. This is a small, opinionated project — the
notes below keep contributions consistent with the codebase.

## Getting started

1. **Fork** the repository and **clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/strive.git
   cd strive
   ```
2. Install dependencies and set up your environment:
   ```bash
   npm install
   cp .env.example .env.local   # then fill in your own values
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

See the [README](../README.md) for the full quick-start and tech stack.

## Branching & pull requests

- Branch off **`dev`**, never `main`.
- **All pull requests target `dev`.** `main` is the deploy branch and is only
  updated by merging `dev`.
- Name branches by intent: `feature/<short-desc>`, `fix/<short-desc>`, or
  `chore/<short-desc>`.
- Keep PRs focused — one concern per PR.

## Code standards

- **TypeScript strict** — no `any` escapes; the build runs `tsc --noEmit`.
- **Styling** uses Tailwind **design tokens** (`bg-card`, `text-foreground`,
  `border-border`, …). Don't hardcode hex colors — see
  [docs/DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md).
- **Code is written in English**; only `messages/fr.json` holds French copy. All
  user-facing strings go through `next-intl` (`messages/en.json` + `fr.json`),
  never hardcoded in components.
- Respect **Strive terminology** (Ritual, Momentum, Rhythm, The Arc, …). Read
  [docs/UX_WRITING.md](../docs/UX_WRITING.md) before naming anything user-facing.
- Before opening a PR, make sure these pass:
  ```bash
  npx tsc --noEmit
  npx eslint .
  npx vitest run
  ```

## Commits

Write clear, present-tense commit messages describing the change. Group related
changes; avoid "wip" commits in the final PR.

By contributing, you agree that your contributions are licensed under the
project's [LICENSE](../LICENSE) (PolyForm Noncommercial 1.0.0).
