# Raw: UXia insights report

The platform's own analysis of the three sessions, reproduced as exported (free
tier). This is **the tool's interpretation**, not ours: relevance ratings, fix
suggestions and complexity estimates are UXia's. Where our assessment differs,
the disagreement and its evidence are in [`../findings.md`](../findings.md).

Quotes attributed to testers below come from the platform's insight view; some
are not in the step transcripts and presumably come from the post-test answers.

---

## Overview

| # | Insight | Relevance | Category |
|---|---|---|---|
| U1 | AI chat logging accepts messages but does not clearly confirm what was logged to which ritual | **High** | Trust |
| U2 | Ritual creation feels untrustworthy because the saved ritual does not clearly appear on the dashboard | **High** | Trust |
| U3 | Demo entry path feels under-emphasized and does not clearly transition users into the app | Medium | CTAs |
| U4 | Demo dashboard metrics and labels are not self-explanatory, especially with pre-filled data | Medium | Copy |
| U5 | Ritual category selection state is subtle and requires extra attention | Low | Design |

The platform also shows a frequency indicator per insight (icon only, no value
exported). Detail was exported for all five insights; U4's description and impact sections were not.

---

## U1: AI chat logging accepts messages but does not clearly confirm what was logged to which ritual

**Relevance:** High · **Category:** Trust

### Description

> In the AI chat, users can send natural-language messages that appear as sent bubbles with a typing indicator, but there is no explicit confirmation of how the app interpreted the log. The interface does not clearly state which ritual the activity was matched to, nor does it summarize the logged details, so users are left to assume rather than know what the system did.
>
> For a habit-focused app where accuracy and history matter, this lack of reflection - such as naming the ritual, showing the date, or paraphrasing the recorded activity - makes it hard to trust that the log was stored correctly rather than just displayed as chat. This undermines the core promise of conversational logging, especially right after users have gone through the effort of defining a meaningful new ritual that they expect to see acknowledged here.

### Impact assessment

- **User impact:** Users cannot tell which ritual a chat log was matched to or what exact details were recorded, leading to uncertainty, potential duplicate logs, or reluctance to rely on conversational logging.
- **Business impact:** Erodes trust in a core differentiated feature, risking lower continued use of chat logging and weakening the product's value proposition and retention.

### What testers said

- **Avery R.:** "I'm still uneasy that Morning yoga was not visible on the dashboard, and I need the chat response to make clear that this activity went to the right ritual."
- **Arjun D.:** "I still want to see the exact activity and date recorded because a small mistake would make me unsure whether the ritual was updated properly."
- **Morgan L.:** "there still wasn't confirmation that it had tied the message back to Morning walk yet"

### Fix suggestion

> **Echo parsed log details and the matched ritual in chat responses.** When the AI accepts a natural-language log, immediately display a confirmation message that names the matched ritual, restates the interpreted details (amount, date/time), and shows a compact 'Saved to [Ritual Name] — View entry' affordance that links to the recorded item. This explicit reflection removes ambiguity about what was logged and where it's stored.

**Technical complexity (platform estimate):** Complex, major redesign.

### Affected frame

Final captured state of the session (Arjun D.): chat panel open, user bubble "I read for 15 minutes today.", assistant typing indicator, no reply rendered yet.

---

## U2: Ritual creation feels untrustworthy because the saved ritual does not clearly appear on the dashboard

**Relevance:** High · **Category:** Trust

### Description

> After completing the ritual creation sheet, users are returned to the Today dashboard without seeing their new ritual clearly added to the active list. In several cases, the newly created ritual appeared to be missing or obscured by existing demo rituals, leaving users unsure whether their setup work had actually been saved.
>
> In some instances the dashboard showed only older demo cards or presented a similar but different ritual (e.g., "Read 30 min" instead of the newly defined "Read for 15 minutes"), which created confusion about whether the new item had replaced something, been renamed, or failed to save. Because there is no strong confirmation state - such as a toast, highlight, or obvious new card - closing the sheet alone does not feel like reliable proof of success.
>
> This uncertainty directly affects a core step in the mission, since users need to trust that their personally meaningful ritual has been created before they move on to log it via chat. The shaky handoff between [the sheet and the] dashboard undermines confidence not only in the save action itself but also in the broader reliability of the app's flexible-consistency promise.

### Impact assessment

- **User impact:** After creating a ritual users are uncertain whether their entry was saved because it does not visibly appear or is obscured, causing doubt and blocking confidence to continue using the app.
- **Business impact:** Failure to clearly confirm saves will reduce task completion, increase drop-off after setup, and harm retention and long-term engagement with core habit features.

### What testers said

- **Morgan L.:**
  - "The setup sheet did close, but I do not see the newly created "Morning walk" card anywhere on the dashboard, so the previous save is not visibly confirmed even though the sheet disappeared."
  - "I'd fix the feedback after saving a ritual, hands down."
- **Arjun D.:**
  - "the existing "Read 30 min" card makes it unclear whether my new reading ritual replaced something or was not added."
  - "I came back to Today and still couldn't see my new "Read for 15 minutes" ritual, which made me unsure whether it actually saved."
  - "I would make the demo entry and ritual save much clearer."
- **Avery R.:**
  - "The bigger inconsistency came after I created "Morning yoga": the sheet closed, but the new ritual didn't appear on the dashboard, which made me doubt whether the setup saved at all."
  - "I'd also want the ritual save flow to be more explicit, because creating Morning yoga was s[…] dropped back to the dashboard without showing the new ritual, it made me doubt whether I'd saved anything at all."
  - "the demo was good at the mindset but a little sloppy in execution when my new ritual didn't immediately show up after creation."

### Fix suggestion

> **Show an obvious save confirmation and highlight the new ritual.** After ritual creation, display a brief success toast plus temporarily highlight or animate the newly created ritual card (e.g., pulse or outline) and auto-scroll so it's visible at the top of the active list; include the exact name and details in the confirmation. This gives reliable proof the ritual was saved and prevents confusion with pre-existing demo cards.

**Technical complexity (platform estimate):** Moderate, requires planning.

---

## U3: Demo entry path feels under-emphasized and does not clearly transition users into the app

**Relevance:** Medium · **Category:** CTAs

### Description

> On the landing page, the demo path does not feel like an obvious, instant way to enter the app compared with the much more visually dominant early-access/sign-up button. Several testers had to pause to verify that "Try the demo" was the route they wanted, because the lighter, outlined styling and lower placement made it feel secondary to the primary call-to-action.
>
> After tapping the demo option, the screen often appeared unchanged with no strong confirmation or transition, so users were unsure whether anything had happened. Some had to scroll down to the "See it in action" area to realize that the demo state was active, which slowed what was expected to be a one-tap, no-signup entry into the product and reduced confidence in the path they had chosen.

### Impact assessment

- **User impact:** Users hesitate or pause to confirm how to enter the app, and some must scroll or look for confirmation after tapping, which interrupts the expected one-tap demo experience.
- **Business impact:** Reduced demo [engageme]nt and lower conversion from casual visitors into active trial users due to friction and uncertainty at the primary entry point.

### What testers said

- **Morgan L.:** "Try the demo" is easy to find in the centered button group, though it is lighter and less prominent than "Get early access," so it takes a moment to confirm which option gives instant access."
- **Avery R.:**
  - "It is a pale outlined button under the much louder early-access button, so it is easy to miss if I am scanning too quickly."
  - "I tapped "Try the demo" and nothing happened until I scrolled down to "See it in action," which felt like unnecessary friction for something that's supposed to be quick"
- **Arjun D.:**
  - "the darker "Get early access" button gets more visual weight than "Try the demo," which makes the no-sign-up path feel a little secondary even though that's what I wanted."
  - "I tapped "Try the demo" and was still looking at the same landing page with no clear sign that anything had happened, so I immediately started doubting whether it[…]"

### Fix suggestion

> **Make 'Try the demo' a primary, unmistakable entry.** Promote the demo CTA visually and add an immediate transition feedback: use a filled/high-contrast button placed near the top, and after tap show a clear full-screen modal or animated transition with the label "Demo mode — no signup required" and a short progress indicator. This reduces hesitation and confirms the one-tap, no-signup promise so users don't have to hunt for proof the demo is active.

**Technical complexity (platform estimate):** Simple, quick fix.

---

## U4: Demo dashboard metrics and labels are not self-explanatory, especially with pre-filled data

**Relevance:** Medium · **Category:** Copy › Trust

### What testers said

- **Arjun D.:**
  - "seeing sample rituals already filled in makes me wonder how my own progress will be shown."
  - "The Today screen could also explain the demo progress labels like "Steady," "3/7," and "2 of 4 logged" in plain language so the flexible-consistency idea feels connected to what I'm actually seeing."

### Fix suggestion

> **Annotate dashboard metrics with plain-language tooltips.** Add concise inline copy or an explainer banner that translates compact metrics (e.g., "3/7 → Times this week", "Steady → On track with flexible consistency") and mark pre-filled cards as "Sample data" until the user creates their first ritual. This clarifies what each label means and whether values are sample or user-specific, speeding comprehension of the dashboard's flexible-consistency model.

**Technical complexity (platform estimate):** Moderate, requires planning.

**Affected frames:** two frames from Arjun D.'s session.

---

## U5: Ritual category selection state is subtle and requires extra attention

**Relevance:** Low · **Category:** Design

### Description

> When choosing a ritual category, the visual difference between unselected and selected pills is small enough that users must look closely to confirm which option is active. This adds a minor moment of uncertainty during setup, since the user pauses to double-check that the intended category (e.g., Movement) is actually selected before continuing.
>
> While it does not block progress, the subtle selection state slightly slows an otherwise smooth creation flow and can make the interface feel less immediately clear at a glance.

### Impact assessment

- **User impact:** Users must look closely to confirm category selection, introducing a small hesitation in the setup flow and a risk of mis-selection.
- **Business impact:** Minor increase in setup friction and potential for incorrect choices; cumulatively this reduces perceived polish and may slightly lower completion rates.

### What testers said

- **Avery R.:** "Ugh, the category pills all look nearly identical before selection, but at least the label is clear."

### Fix suggestion

> **Increase visual contrast for selected category pill state.** Make the selected category pill more obvious by using stronger color fill, a bolder border, or an icon change when active and add a short microcopy like "Selected" on hover/tap. This reduces the small hesitation users take to confirm their choice during setup without changing flow or layout significantly.

**Technical complexity (platform estimate):** Simple, quick fix.
