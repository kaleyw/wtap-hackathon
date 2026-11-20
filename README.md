# RBC Candor

**A private, always-on space where RBC's co-ops and new grads can be candid, and where that candor turns into change.**

Built for the WTAP hackathon, for the Early Talent team in RBC's AI Group.

## At a glance

- **Who it's for:** co-ops and new grads ("early talent") in RBC's AI Group, and the Early Talent team that supports them.
- **What it does:** a private **Journal** built on their real Jira, Azure DevOps and GitHub tickets; an anonymous **Echo Feed**; and a dashboard that turns posts into anonymous patterns, early warnings and fixes.
- **Why it's different:** feedback is captured every day as people track their own work, not in surveys with their name attached. Early talent get something back right away (manager talking points, resume bullets), and every post is checked by **Echo Shield** to stay anonymous and constructive.
- **Status:** a working prototype with sample data. Run it with `npm install && npm run dev`, then follow [Try it in 5 minutes](#try-it-in-5-minutes).

---

## The problem

Today the Early Talent team hears from co-ops and new grads through 1:1s with hiring managers, midterm and final evaluations, end-of-event surveys and attendance numbers. That leaves three gaps:

1. **The name is attached.** Honest feedback is risky when the person listening shapes your return offer, so people say what's safe.
2. **It's tied to timeframes.** Real conversations happen at performance reviews. By then, someone who's struggling has often already decided to leave.
3. **It comes from everywhere and lives nowhere.** Anecdotes sit in a manager's head, a survey, a hallway chat. Nothing turns them into data, and early talent rarely see what changed.

## What Candor does

Candor has two sides: one for **co-ops and new grads**, one for the **Early Talent team**.

### For co-ops and new grads

| | What it is | Why they use it |
|---|---|---|
| **Journal** | Their real tickets from Jira, Azure DevOps or GitHub on one board, plus private notes. Logging the day is one tap (*Shipped*, *Blocked*, *Felt left out*) or a line, typed or dictated. | It's framed as tracking progress, not answering a survey, and it builds a record of everything they've done at RBC. |
| **Turn my work into words** | AI turns their tickets and notes into talking points for their manager (with coaching on how to pitch their work) and resume bullets. | Talking about your work is a key career skill. Candor gives back before it asks for anything. |
| **How you're doing** | A private read based on how they write over the term and how their work is going, always with the reasons. Offers a chat with other early talent, a coordinator, or a suggested way to raise it with their manager. | Early support, on their terms. Only they see it. |
| **Echo Feed** | Post anonymously any time, as *Just sharing* or *I'd like a follow-up*. Our current surveys can't tell the difference; Candor can. Others tap **Echo** if it's true for them too. Similar posts are grouped, and 25 echoes escalates a post to the team. | They see they're not alone, and they see what changed because they spoke up. |
| **Circles** | Small anonymous group chats for highly echoed issues, where people can also suggest and upvote fixes. | Peer support, and ideas the team can act on. |
| **Wrapped** | A private end-of-term recap with talking points for the final review. | A reason to keep logging all term. |

### For the Early Talent team

- **Overview:** anonymous patterns by line of business and office, leaving signals by week (with the midterm and return-offer danger zones), what's driving the risk, and an end-of-term report.
- **Respond:** posts where someone asked for a follow-up, posts escalated at 25 echoes, and sensitive cases.
- **What to fix:** issues grouped and ranked, **AI fix suggestions** drafted from the posts and from the fixes early talent proposed, and a **"You said, we did"** response that closes the loop.

## How Candor meets the judging criteria

| Criterion | How Candor answers it |
|---|---|
| **Solution development:** captures early talent, identifies risk of leaving, considers performance | Feedback any time, anonymously, with *Just sharing* vs *I'd like a follow-up*. Leaving signals come from two sources: the person's own wording ("we" turning into "they", fewer people mentioned, no more talk of next term, frustrated tone) and their ticket progress (tickets stuck 10+ days, a rising share of admin work, a drop in finished work). Performance data is used to support people, never to rate them, and no one but the person sees their individual read. |
| **Innovative solution:** fits existing tools, easy to implement | Lives inside the tools people already use: Jira, Azure DevOps and GitHub Projects, with two-way status sync. Complements midterm evaluations and event surveys instead of replacing them. AI turns scattered anecdotes into grouped, counted issues. |
| **Viability and business value:** quick green light, realistic, not cost prohibitive | Runs as a web app with no new infrastructure beyond tools RBC already has. AI is optional: every AI feature has a built-in fallback, so it works with the AI switched off. Start with a one-term pilot in the AI Group, then expand. |

## Keeping it safe, not toxic

Every post and Circle message goes through **Echo Shield** before anyone sees it:

- **Anonymity:** removes names, emails, phone numbers, @mentions, project and team names. Generalizes details that could identify someone (cities, schools, exact dates, "the only co-op on my team"). Smooths writing style (emoji, slang, ALL CAPS) and blurs post times. Locations and filters never show a group smaller than 5.
- **Constructive by design:** the rule is *a situation, never a person or a named team*. Posts that attack someone or spread rumours are stopped, and Candor suggests a version about the experience, for example *"My mentor keeps cancelling our check-ins, so I'm not getting the guidance I need."*
- **Serious cases:** harassment reports are posted anonymously with the poster's identity sealed. Only an investigator can unseal it, with a logged reason, and the poster is told this before posting. Crisis messages aren't posted; the person sees support resources instead.
- **Live preview:** as someone types, Echo Shield shows exactly what others will see and what it changed.

## Try it in 5 minutes

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173) in a wide browser window. Everything runs locally with sample data; no account or API key is needed. The ↺ button in the header resets the demo data.

**1. Journal** (Co-ops & new grads view)
- Drag **"Run evals on production data"** from *In progress* to *Done*. The card shows it syncing to Jira, and Candor asks *"What did this unlock?"*
- Add a quick note, then open **My notes** under it.
- Scroll to **Turn my work into words** and press **Generate**. Switch to **Resume bullets**.
- At the bottom, **How you're doing** shows the private read and the reasons behind it.

**2. Echo Feed**
- Under the post box, tap **Try Echo Shield → Trash talk**. Press **Post to Echo**: it's stopped. Press **Use this version**, then **Post**.
- Tap **Gives you away** to watch names, school, city and writing style get cleaned up live.
- Note the group chip on each post, and the coloured bar showing its category.
- Filter to **Personal & Commercial Banking** + **Other offices**: results are hidden because fewer than 5 people match.

**3. Early Talent team view**
- **Overview:** heatmap and leaving signals by week.
- **Respond:** reply to a follow-up request; it appears under the post.
- **What to fix:** pick *Mentors are hard to reach*, press **Suggest fixes**, then **Post this response**. It shows up in the Echo Feed's *You said, we did* tab.

## What's real and what's simulated

This is a working prototype. To be clear about what judges are seeing:

| Feature | In this demo | In production |
|---|---|---|
| Tickets and two-way sync | Sample tickets; the sync is simulated, and each ticket shows the exact API request that would be sent | Jira, Azure DevOps and GitHub APIs, using each person's own RBC sign-in |
| AI features (moderation, fix suggestions, manager talking points, resume bullets) | Built-in rules and templates, clearly labelled in the app | Claude via an approved AI provider. Already wired in: set `VITE_ANTHROPIC_API_KEY` in `.env` to switch it on (local demo only, since the key is visible in the browser) |
| Dictation | Browser speech-to-text; fills in a sample sentence where the microphone is blocked | Same, or Microsoft Teams |
| Data | Sample posts and people, saved in your browser | RBC-hosted database behind RBC sign-in |

## Roadmap

1. **Pilot (one term):** the AI Group's current co-ops and new grads. Echo Feed, Journal reading tickets, RBC sign-in.
2. **Phase 2:** two-way ticket sync, quick notes from Microsoft Teams, and bringing the event attendance and workshop survey data the team already collects into the same dashboard.
3. **Phase 3:** expand to other groups, and track participation, response time, leaving signals and return-offer acceptance against past terms.

## Under the hood

React + Vite, no backend for the demo.

| Path | What's there |
|---|---|
| `src/components/MyWork.jsx` | Journal: board, notes, "Turn my work into words", "How you're doing" |
| `src/components/InternApp.jsx` | Co-ops & new grads view: Echo Feed, Circles, composer |
| `src/components/Dashboard.jsx` | Early Talent team view |
| `src/ai/rules.js` | Echo Shield: redaction, generalization, style smoothing, attack/gossip detection, suggested rewrites |
| `src/ai/feelings.js` | The private "How you're doing" read |
| `src/ai/moderate.js`, `suggest.js`, `work.js` | Claude integrations, each with a built-in fallback |
| `src/integrations/trackers.js` | Jira, GitHub Projects and Azure DevOps status sync |
| `src/data/seed.js` | All sample data |
| `echo-demo.html` | The team's original design mockup |
