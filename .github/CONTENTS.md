# .github/

Repository meta files: community health docs and CI automation.

> Named `CONTENTS.md`, not `README.md`, on purpose: GitHub would surface a
> `.github/README.md` as the repo's landing page **instead of** the root
> `README.md`. The project showcase lives in the root [README](../README.md).

## Community health files

GitHub recognizes these whether they sit at the repo root or in `.github/`:

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute (branching, standards).
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Contributor Covenant 2.1.
- [SECURITY.md](SECURITY.md) — responsible vulnerability disclosure.

(`LICENSE` stays at the repo root so GitHub's license detection picks it up.)

## CI & automation

- `workflows/` — GitHub Actions (CI, PR review agent).
- `prompts/` — prompt files used by the automated workflows.
- [WORKFLOWS.md](WORKFLOWS.md) — what each workflow does.
