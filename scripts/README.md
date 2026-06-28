# scripts/

One-off and maintenance scripts. Run from the repo root; TypeScript scripts use
the project's tooling and read `.env.local`.

| Script | What it does |
|---|---|
| `seed-demo.ts` | Seeds the shared demo account (`demo@striveapp.cc`): rituals, ~12 weeks of engineered log history, and the "Sport team" circle. Idempotent — clears and re-seeds the demo accounts. Writes `DEMO_USER_ID` (paste it into `.env.local`). See [LUI-43] demo account. |
| `generate-demo-insights.ts` | One-off generation of the frozen demo Insight Cards, written into `lib/demo-data.ts` (`DEMO_INSIGHTS`) so the nightly demo-reset can re-seed them. |
| `ai-security-check.sh` | CI helper that scans changed files for AI/LLM security issues. Invoked by the PR review workflow. |

> These scripts touch the shared prod/dev database. Read each script before
> running it, and never run them against a database you don't intend to mutate.
