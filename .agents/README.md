# `.agents/` — Reusable Agent Knowledge

This folder hosts **skills**: reusable instruction sets that any AI agent (Claude, Cursor, GitHub Copilot, etc.) can pull from when working on the Strive codebase. Skills are committed to the repo so every agent shares the same baseline knowledge.

## Layout

```text
.agents/
  skills/
    supabase-postgres-best-practices/   # Postgres performance & RLS guidelines
  skills-lock.json                      # Pins each skill to a specific upstream commit
```

## How skills are consumed

Agents discover skills through the project entry files at the repo root:

- [`AGENTS.md`](../AGENTS.md) lists the skills agents must consult before writing code in the relevant area.
- [`CLAUDE.md`](../CLAUDE.md) references the skill paths Claude Code should read first.

For example, `CLAUDE.md` points to `.agents/skills/supabase-postgres-best-practices/SKILL.md` for any database work.

## `skills-lock.json`

Pins each skill to a hashed upstream commit so the content is reproducible:

```json
{
  "version": 1,
  "skills": {
    "supabase-postgres-best-practices": {
      "source": "supabase/agent-skills",
      "sourceType": "github",
      "computedHash": "..."
    }
  }
}
```

Update this file (and re-vendor the skill folder) when bumping a skill version.

## Adding a new skill

1. Vendor the skill folder under `skills/<skill-name>/`. It should contain a `SKILL.md` (the canonical instructions) plus any `references/` it ships with.
2. Add an entry to `skills-lock.json`.
3. Reference the skill from `AGENTS.md` and/or `CLAUDE.md` so agents know when to consult it.
