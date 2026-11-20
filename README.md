# RBC Candor — WTAP hackathon

Anonymous, always-on feedback for RBC AI Group co-ops and new grads. This app merges the team's design mockup (`echo-demo.html`, kept for reference) with the Candor prototype: same look, same three views, plus Echo Shield, grouping, Circles and more.

## What's where

- **Co-ops & new grads:** sidebar with
  - **Journal**: one private workspace. A Jira-style board (Jira, GitHub Projects, Azure DevOps; sample data in the demo) with private notes on each ticket, a quick note with tags, and a gentle "How you're doing" read from your wording over the term plus your ticket progress (stuck tickets, admin share), always with the reasons. "Turn my work into words" writes a manager-ready impact summary (with coaching) or resume bullets from tickets + notes.
  - **Echo Feed**: post box at the top with a live Echo Shield preview ("What others will see") and one-tap examples; filters for co-op/new grad, line of business, province, office; trending; grouping; colour bar per category
  - **My Circles**: discussion threads for highly echoed issues
  - **Wrapped**: end-of-term recap, with playable slides
- **Early Talent team:** three tabs
  - **Overview**: KPIs, where-to-act heatmap, leaving signals by week, who needs help, end-of-term report
  - **Respond**: follow-up requests, escalated posts, sensitive cases
  - **What to fix**: AI fix suggestions (Claude with an API key, built-in playbook without), issue list, fixes early talent suggested, did it work
- Header buttons reset the demo data and toggle light/dark

## Run it

```bash
npm install
npm run dev
```

**Claude moderation (optional):** copy `.env.example` to `.env` and set `VITE_ANTHROPIC_API_KEY`. Without a key, Echo uses its built-in rules, so the demo still works offline. Local demo only: the key is visible in the browser.

All data is fake and stored in your browser. Use **Reset demo** in the header before presenting.

## 3-minute demo script

1. **Intern → Echo Feed → Share anonymously.** Type: `Sarah on my team keeps giving me nothing to do, I feel like nobody here talks to me`
   - While you type, "Others have said something similar" appears. This is the grouping feature.
   - Click **Post anonymously**. "Sarah" becomes `[a person]` before anyone sees it.
   - Post it. A **private nudge** appears on the right, triggered by isolation language. Only the intern sees it.
   - **Echo Shield, part 1 (no trash-talk):** type `My lead Kevin is useless and never answers my questions lol`. The live Shield checklist turns red, and posting is **stopped**. Echo suggests a version about the experience instead ("My questions to my lead often go unanswered, so I end up stuck."). Tap **Use this version**: it gets re-checked and passes. Best line for judges: `My mentor is useless, she cancelled on me AGAIN`.
   - Team names in a post ("the Payments team") become `[a team]`. You post about a situation, never a person or a named team.
   - **Echo Shield, part 2 (true anonymity):** type `I'm the only co-op from uwaterloo in Halifax and nobody talks to me 😭 tbh it's sooo lonely!!!`. Shield generalizes the school, city and "the only…", and smooths the writing style (emoji, slang, "sooo", "!!!").
2. **Location filters:** pick Data Science + "Other offices". Results are **hidden** because only 2 interns match. Switch to Waterloo (6 interns) and posts show. Small offices are never listed by name.
3. **Feed:** posts are sorted by **Trending** by default, so fast-rising posts get a 🔥 badge and sit at the top. Filter by team or category.
   - Each post has a chip showing **which group it belongs to** and whether that group has a **Circle**.
   - Switch to **Grouped** to see each group as one card with its posts stacked inside.
4. Open the "Mentors are hard to reach" group. It shows 23 interns across 4 teams, and its Circle is open.
   **Join** it to get a new alias used only in that Circle. Interns can also suggest fixes and upvote them.
5. Type: `Mike from my team keeps making comments about my accent`
   - It's posted anonymously, but the poster's **identity is sealed**, with an explanation of why.
6. Open **My term Wrapped**: a private, end-of-term recap (most energized moments, top theme, mood by week, talking points for the final review). End on "Would you come back?"
7. **Early Talent dashboard.**
   - Header numbers, the "Rising" banner, and issue groups (filterable by team or category) with a **Respond** button that posts to "You said, we did".
   - **Asked for a follow-up**: reply to interns who asked for one. The reply shows up under their post.
   - Theme × team heatmap, where cells under 5 people are hidden.
   - Anonymous risk charts and the nudge funnel.
   - **Echo Shield this week**: counts of names removed, details generalized, styles smoothed and posts stopped. Never the blocked text.
   - Heatmap toggle **By team / By office**, plus province and office filters (with the same 5+ rule).
   - **Sensitive cases**: Unseal for investigation, which requires a logged reason.
   - **End-of-term report**: anonymous totals from everyone's Wrapped, including return intent and what predicts coming back.

## Where things live

- `src/ai/moderate.js`: Claude moderation (structured JSON output, with automatic fallback to rules)
- `src/ai/rules.js`: offline redaction, harassment/crisis detection, grouping, and risk signals
- `src/data/seed.js`: all fake data (groups, posts, threads, risk numbers)
- `src/store.jsx`: app state (in memory, saved to localStorage)
