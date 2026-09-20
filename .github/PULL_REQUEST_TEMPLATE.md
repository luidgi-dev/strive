<!-- Branch off `dev` and target `dev`. `main` is the deploy branch.
     See CONTRIBUTING.md for the full rules. -->

## Summary

<!-- What changes, and why. One or two sentences. -->

## Type

<!-- Keep one -->
Feature · Fix · Improvement · Chore · Docs

Closes LUI-

## Checklist

CI runs TypeScript (strict), ESLint, Vitest and the Next.js build. The PR review
agent checks terminology, design tokens, user identity handling and architecture.
This list covers only what neither of them can.

- [ ] Checked on a mobile viewport, which is the primary target
- [ ] Every new user-facing string exists in both `messages/en.json` and `messages/fr.json`
- [ ] Docs updated if this changes structure, tokens, terminology or setup
- [ ] Screenshots below for any visible change

## Database

- [ ] This PR changes nothing under `data/`

If it does, say what has to be applied, on which environments, and in what order.
`migrate.py` replays seeds that contain test data, so it cannot be pointed at
production.

## Notes for the reviewer

<!-- Trade-offs taken, what you deliberately did not do, anything you want challenged. -->
