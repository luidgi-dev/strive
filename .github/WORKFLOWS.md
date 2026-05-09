# `.github/` — CI & Review Automation

GitHub-side automation for Strive: continuous integration workflows and the prompts they feed to AI reviewers.

## Layout

```text
.github/
  workflows/   # GitHub Actions — runs on push/PR/schedule
  prompts/     # System prompts consumed by the workflows above
```

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| [`workflows/pr-review.yml`](workflows/pr-review.yml) | On pull request | AI-assisted review of PR changes against Strive conventions (terminology, code semantics, App Router patterns). |
| [`workflows/project-audit.yml`](workflows/project-audit.yml) | Scheduled / manual | Periodic project-wide audit looking for documentation drift, terminology drift, and architectural health issues. |

## Prompts

| File | Used by |
|---|---|
| [`prompts/strive-pr-reviewer.md`](prompts/strive-pr-reviewer.md) | `pr-review.yml` — guides per-PR review focus |
| [`prompts/strive-project-reviewer.md`](prompts/strive-project-reviewer.md) | `project-audit.yml` — guides whole-repo audit |

Prompts reference `AGENTS.md`, `docs/UX_WRITING.md`, and `docs/ARCHITECTURE.md` as authoritative sources. When you change those, double-check the prompts still align.

## Adding a workflow

1. Drop the workflow file in `workflows/`.
2. If it relies on an AI reviewer, add the system prompt under `prompts/` and reference it from the workflow.
3. Document the trigger and purpose in the table above.
