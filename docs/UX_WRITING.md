# Strive UX Writing & Terminology Guide (LUI-15)

Ce document impose la terminologie et la voix à utiliser dans toute la UI, les messages d’erreur/succès, l’onboarding et les générations d’agents (dev + IA).

## Règle d’or
Utilise les termes canoniques ci-dessous. Évite les synonymes “interdits” listés dans chaque entrée.

## Terminology Reference

| Product concept | Canonical term | Don't use (alternatives) | Notes |
|---|---|---|---|
| A single unit a user performs | Ritual | Task, Habit | “Ritual” est le terme principal côté produit. “Habit” n’est acceptable que dans des formulations explicatives, pas comme nom d’interface. |
| List/board of rituals | Ritual board | To-do list | Terme UI pour l’espace où l’utilisateur gère ses rituels. |
| The main dashboard experience | The Flow | Dashboard | “The Flow” est le nom de l’interface/section principale. |
| Progress unit over time | Momentum | Streak | “Momentum” remplace l’anxiété de “streak”. |
| Progress encouragement | Great momentum! | Great streak! | Exemple de ton (encourage, pas culpabilisant). |
| Completed state / confirmation | Logged | Completed | Utilise “Logged” quand l’utilisateur a enregistré une action. |
| Successful completion badge/CTA feedback | Nailed it | Done, Completed | “Nailed it” sert au feedback de réussite (et pas un bouton “Done”). |
| Primary action after input | Log | Log/Track (sans préférence), Complete | “Log” est la forme préférée pour l’action et la confirmation. |
| Tracking intent | Track | Track streak | “Track” doit mener à une action “Log” dans la UI (selon le contexte). |
| User marks something complete | Log | Complete, Mark as done | Remplace “Complete” par “Log” (et rétroaction “Logged” / “Nailed it”). |
| Completion feedback | Logged | Completed | Exemple: “Ritual logged.” |
| Completion feedback (celebratory) | Nailed it | Done | Exemple: “Nailed it! One more ritual, one more step.” |
| Item list entries | Ritual item | Task item | Nommer les composants et libellés en UI selon “Ritual”. |
| Action button label | Log | Done, Complete | Cas “Done” interdit pour les boutons d’action. |
| Empty state (board) | Your ritual board is empty | You have no tasks | Le vide doit être positif et orienté action. |
| Empty state (flow) | Start building momentum | No dashboard items | Éviter les formulations “No X” sans guidance. |
| Onboarding step | Add your first ritual | Add your first task | Encourage la discipline flexible (pas la contrainte). |
| Error message (logging) | Couldn't log the ritual | Unable to complete task | Ton: direct, utile, pas culpabilisant. |
| Validation message (form) | Add a ritual name | Task name is required | Éviter “task” dans les labels d’interface. |
| Success message | Ritual logged | Task completed | Ton: concis, positif. |
| Progress summary | Momentum over time | Streak over time | Mettre l’accent sur la continuité flexible. |
| Weekly/monthly consistency | Consistency | Streak | Présenter la logique en “consistance” plutôt qu’en “quotas de jours”. |
| System concept “run” | Log a ritual run | Mark a streak | “Run” est acceptable comme description technique, mais l’UI reste “Log”. |
| CTA to begin | Start a ritual | Start a task | “Start” + “Ritual” (pas “Task”). |
| CTA to review | Review the Flow | Open dashboard | “The Flow” en contexte UI. |
| Section header | Your rituals | Your tasks | Éviter “tasks”. |
| Success toast | Logged | Done | Toast doit être “Logged” ou “Nailed it” selon intensité. |
| Status pill / label | Logged | Completed | Utilisé en petits UI éléments. |
| Confirmation microcopy | Nice. Logged. | Nice. Done. | Court et conversationnel. |
| API response semantic | status: "logged" | status: "completed" | API: préférer les valeurs “logged” côté semantics. |
| DB column semantic | logged_at | completed_at | Préférer `logged_at` plutôt que `completed_at`. |
| Object identifier | ritual_id | task_id | Préférer “ritual”. |
| Component name | RitualCard | TaskCard | Préférer “Ritual”. |
| Component name | RitualBoard | ToDoList/TaskList | Le terme UI est “Ritual board”. |
| Page/route name | flow | dashboard | Si une route porte un terme, elle doit utiliser “flow”. |
| Marketing-ish page title | The Flow | Dashboard | Pour le titre de section/écran. |
| Voice: verbosity level | Minimalist | Verbose | Court, utile, sans explications inutiles. |
| Voice: encouragement | Encouraging | Punishing | Pas de “You failed…” à la place de “You kept your momentum.” |
| Voice: tone | Conversational | Robotic | Formulations naturelles (sans “successfully…”). |
| Action verb (preferred) | Log | Complete | “Log” est la préférence globale. |
| Action verb (allowed) | Track | Track | “Track” ok seulement si l’action UI reste “Log” au final. |
| Feedback phrase | Nailed it! | Great job / Done | “Nailed it” canonique pour feedback de réussite. |
| Motivation line | Keep going with momentum | Keep your streak | Éviter “streak”. |
| Error recovery hint | Try again when you're ready | Try again to complete | Pas culpabilisant, orienté timing. |
| Naming: list “to-do” | Ritual board | To-do list | Terminologie UI. |
| Naming: “completed” state | Logged | Completed | Même en code: préférer “logged”. |
| Naming: “done” state | Nailed it / Logged | Done | “Done” interdit pour boutons/texte utilisateur. |
| Microcopy: “progress” | Momentum | Streak | Systématique. |
| Microcopy: “result” | Logged / Nailed it | Completed / Done | Systématique. |
| User motivation framing | Keep momentum | Keep your streak | Formulation encouragement pour éviter “streak”. |

> Note: le mapping canonique demandé par LUI-15 inclut `Task -> Ritual (ou Habit)` et `Streak -> Momentum`, ainsi que `Completed -> Logged` et `Dashboard -> The Flow`. Dans la pratique UI, utilisez “Ritual” / “Momentum” / “Logged” / “The Flow” comme termes par défaut.

## Tone & Voice Guidelines

### Comment Strive “parle”
- Minimaliste, pas verbeux: “Log run”, pas “Please log your running activity”.
- Encourageant, pas culpabilisant: “Great momentum!”, pas “You failed to maintain your streak”.
- Conversationnel, pas robotique: “Nailed it!”, pas “Successfully marked complete”.
- Assume l’intelligence de l’utilisateur: évite les tutoriels dans la microcopy.

### Do / Don't (résumé)
- Do: “Ritual logged.”
- Don't: “Task completed.”
- Do: “Your ritual board is empty.”
- Don't: “You have no tasks.”
- Do: “Great momentum!”
- Don't: “Great streak!”

## Copy Examples (Before / After)

1. Button (action)
   - Before: `Done`
   - After: `Log` (ou `Nailed it` pour un feedback, pas un bouton)

2. Button (completion)
   - Before: `Complete task`
   - After: `Log ritual`

3. Status message
   - Before: `You completed 3 tasks.`
   - After: `You logged 3 rituals.`

4. Success toast
   - Before: `Task completed`
   - After: `Nailed it!`

5. Progress label
   - Before: `Current streak`
   - After: `Momentum`

6. Encouragement line
   - Before: `Great streak!`
   - After: `Great momentum!`

7. Section header / screen title
   - Before: `Dashboard`
   - After: `The Flow`

8. Empty state (board)
   - Before: `You have no tasks`
   - After: `Your ritual board is empty`

9. Form label
   - Before: `Task name`
   - After: `Ritual name`

10. Error message
   - Before: `Unable to complete task`
   - After: `Couldn't log the ritual`

## AI & Code Integration

Cette section explique comment traduire les termes dans le code et dans les sorties d’IA.

### Nommage dans le code
- IDs et variables:
  - `ritual_id` (pas `task_id`)
  - `momentum` (pas `streak`)
  - `logged_at` (pas `completed_at`)
  - `flow` (pas `dashboard`)
- Composants:
  - `RitualCard`, `RitualBoard`
  - `Flow` (page/section), `FlowHeader` (si besoin)
- Classes/IDs DOM:
  - `ritual-card`, `ritual-board`, `flow-header`

### API et schémas
- Expose des états sémantiques cohérents:
  - `status: "logged"`
  - évite `completed` côté réponse sémantique (sauf migration legacy)
- Colonne DB:
  - `logged_at`
  - évite `completed_at` dans le schéma “nouveau”

### Erreurs, feedback et événements
- Texte d’erreur:
  - “Couldn't log the ritual” plutôt que “Unable to complete task”
- Texte de succès:
  - “Ritual logged.”
  - “Nailed it!” quand c’est une réussite encourageante

## Terminology Checklist (Agents)

Avant de générer/éditer une UI, un message ou une intégration API:
- [ ] Utiliser `Ritual`, pas `Task`
- [ ] Utiliser `Momentum`, pas `Streak`
- [ ] Utiliser `Logged`, pas `Completed`
- [ ] Utiliser `The Flow`, pas `Dashboard`
- [ ] Boutons d’action: éviter le texte `Done`
- [ ] Les labels “completion” doivent devenir `Log` / `Logged`
- [ ] Ton: minimaliste, encourageant, conversationnel
- [ ] Les erreurs: orientées “récupération”, pas culpabilisation
- [ ] Noms de code alignés (`ritual_id`, `logged_at`, `momentum`, `flow`)
- [ ] Exemple correct vs incorrect cohérent avec les sections ci-dessus

