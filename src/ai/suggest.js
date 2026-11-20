// "What to fix": AI-suggested fixes for one issue group.
// With VITE_ANTHROPIC_API_KEY it asks Claude; otherwise it uses a built-in playbook (labelled as such in the UI).
import Anthropic from '@anthropic-ai/sdk'
import { LOBSHORT } from '../data/seed.js'

const KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
// Local demo only: the key is visible in the browser. Never deploy this build.
const client = KEY ? new Anthropic({ apiKey: KEY, dangerouslyAllowBrowser: true }) : null

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'root_causes', 'actions', 'measure', 'response_draft'],
  properties: {
    summary: { type: 'string' },
    root_causes: { type: 'array', items: { type: 'string' } },
    actions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['title', 'detail', 'owner', 'effort', 'impact'],
        properties: {
          title: { type: 'string' }, detail: { type: 'string' }, owner: { type: 'string' },
          effort: { type: 'string', enum: ['Quick win', 'Medium', 'Bigger project'] }, impact: { type: 'string' },
        },
      },
    },
    measure: { type: 'string' },
    response_draft: { type: 'string' },
  },
}

const SYSTEM = `You advise the Early Talent team in a bank's AI Group. Early talent are co-ops and new grads.
Given one issue that many of them raised anonymously, suggest practical fixes the team could greenlight quickly and cheaply.
Ground everything in the posts and the fixes early talent suggested themselves; prefer those when they make sense.
Return: a one-sentence summary; 2-3 likely root causes; 3 actions (title, one-sentence detail, owner such as "Early Talent team", "Hiring managers", "Mentors", "IT onboarding", effort, expected impact); how to measure in 2-4 weeks using Echo data; and a short "You said, we did" response draft addressed to early talent, no names.`

export async function suggestFixes(ctx) {
  if (client) {
    try {
      const response = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(describe(ctx), null, 2) }],
      })
      if (response.stop_reason !== 'refusal') {
        const block = response.content.find((b) => b.type === 'text')
        return { ...JSON.parse(block.text), source: 'claude' }
      }
    } catch (err) {
      console.warn('Claude suggestions failed, using playbook:', err)
    }
  }
  await new Promise((r) => setTimeout(r, 700)) // feels like thinking in the demo
  return { ...playbook(ctx), source: 'playbook' }
}

function describe({ group, posts, fixes }) {
  return {
    issue: group.title, theme: group.theme, people: group.people.length, growth_last_2_weeks: `${Math.round(group.growth * 100)}%`,
    by_line_of_business: group.teams, by_office: group.offices,
    posts: posts.map((p) => ({ text: p.text, echoes: p.echoes, role: p.role || 'Co-op' })),
    fixes_suggested_by_early_talent: fixes.map((f) => ({ text: f.text, votes: f.fixVotes })),
  }
}

// ---- Built-in playbook (no API key) ----
const topOf = (o) => Object.entries(o || {}).sort((a, b) => b[1] - a[1])[0]?.[0]
const PLAYBOOK = {
  Mentorship: {
    causes: ['Mentors carry several mentees on top of a full workload', 'No backup when a mentor is busy or away', 'Check-ins are informal, so they are the first thing to slip'],
    actions: [
      ['Name a backup mentor for everyone', 'Pair each person with a second mentor from another team for weeks when the main mentor is unavailable.', 'Early Talent team', 'Quick win', 'Fewer “no one to ask” posts within 2 weeks'],
      ['Protect a recurring 30-minute check-in', 'Ask mentors to book a standing weekly slot; Echo flags 2 missed check-ins in a row to the program team.', 'Mentors', 'Quick win', 'Steadier support during the week-6 dip'],
      ['Cap mentees per mentor at 2', 'Rebalance pairings where mentors have 3 or more mentees.', 'Early Talent team', 'Medium', 'More time per person'],
    ],
  },
  Onboarding: {
    causes: ['Laptops and access requests start on day one instead of before it', 'No single contact owns the first week', 'New joiners lack context on how their work fits in'],
    actions: [
      ['File access and hardware 2 weeks before start', 'Trigger laptop and core-access requests when the offer is signed.', 'IT onboarding', 'Medium', 'Productive from day one'],
      ['One onboarding contact per person', 'A named person owns the first two weeks and unblocks tickets.', 'Early Talent team', 'Quick win', 'Fewer stalled tickets'],
      ['“How your work fits” session in week 1', 'Each team runs a 30-minute walkthrough of its goals and where new joiners contribute.', 'Hiring managers', 'Quick win', 'Clearer purpose, fewer “what does my team do” posts'],
    ],
  },
  'Career growth': {
    causes: ['Return-offer criteria and timelines are not shared', 'No clear way to explore other teams', 'Feedback is saved for the final review'],
    actions: [
      ['Publish return-offer criteria and timeline in week 1', 'Share what “good” looks like and when decisions go out (by week 12).', 'Early Talent team', 'Quick win', 'Less uncertainty during return-offer season'],
      ['Run a career-paths panel with AI Group alumni', 'Former co-ops and new grads explain moves between teams and into research.', 'Early Talent team', 'Medium', 'Better retention intent in Wrapped'],
      ['Add a midterm growth conversation', 'Managers use Echo’s talking points to discuss goals and next steps at midterm.', 'Hiring managers', 'Quick win', 'Earlier feedback, fewer surprises'],
    ],
  },
  Workload: {
    causes: ['Work dries up after the first project', 'Deadlines cluster before demos', 'Managers lack visibility into idle time or overload'],
    actions: [
      ['Keep a backlog of “next project” ideas per team', 'Managers list 2-3 stretch projects so nobody runs out of meaningful work.', 'Hiring managers', 'Quick win', 'Fewer “nothing to do” posts'],
      ['Demo-week workload check', 'The program team checks in with teams 1 week before demo days.', 'Early Talent team', 'Quick win', 'Less weekend crunch'],
      ['Ownership goal at midterm', 'Each person names one piece of work to own end to end.', 'Hiring managers', 'Medium', 'More engagement, stronger final reviews'],
    ],
  },
  'Team dynamics': {
    causes: ['Decisions happen in meetings early talent are not invited to', 'People at smaller offices have no local peers', 'Teams have few social touchpoints'],
    actions: [
      ['Invite early talent to planning and decision meetings', 'Default co-ops and new grads into sprint planning and design reviews.', 'Hiring managers', 'Quick win', 'Fewer “left out” posts'],
      ['Cross-office peer pods', 'Group people at smaller offices into virtual pods of 5-6 that meet weekly.', 'Early Talent team', 'Medium', 'Less isolation; shrinking-network signals drop'],
      ['Monthly team lunch or social', 'A small budget for regular team time, in person where possible.', 'Hiring managers', 'Quick win', 'Stronger team connection'],
    ],
  },
}

function playbook({ group, posts, fixes }) {
  const pb = PLAYBOOK[group.theme] || PLAYBOOK['Team dynamics']
  const lob = topOf(group.teams), office = topOf(group.offices)
  let actions = pb.actions.map(([title, detail, owner, effort, impact]) => ({ title, detail, owner, effort, impact }))
  const idea = fixes[0]?.text.replace(/^(suggestion|idea|fix)\s*:\s*/i, '').replace(/\.$/, '')
  if (idea) {
    // skip playbook actions that repeat the early-talent idea
    const COMMON = new Set(['mentor', 'mentors', 'manager', 'managers', 'another', 'always', 'someone', 'people', 'person'])
    const words = new Set((idea.toLowerCase().match(/[a-z]{6,}/g) || []).filter((w) => !COMMON.has(w)))
    actions = actions.filter((a) => !(a.title.toLowerCase().match(/[a-z]{6,}/g) || []).some((w) => words.has(w)))
    actions.unshift({ title: `Pilot the top idea from early talent: “${idea}”`, detail: `${fixes[0].fixVotes} people upvoted this in the Circle. Try it with one team first.`, owner: 'Early Talent team', effort: 'Quick win', impact: 'Shows people their ideas are heard' })
  }
  return {
    summary: `${group.people.length} co-ops and new grads raised “${group.title.toLowerCase()}”, most in ${LOBSHORT[lob] || lob}${office ? ` and the ${office} office` : ''}, and it’s ${group.growth > 0 ? `up ${Math.round(group.growth * 100)}%` : 'steady'} over 2 weeks.`,
    root_causes: pb.causes,
    actions: actions.slice(0, 4),
    measure: `Watch posts and echoes on this issue, and leaving signals tied to ${group.theme.toLowerCase()}, for 2-4 weeks after launch. Aim for a 30%+ drop.`,
    response_draft: `${group.people.length} of you told us “${group.title.toLowerCase()}”. Here’s what we’re doing: ${actions[0].title.replace(/^Pilot the top idea from early talent: /, 'piloting your idea, ').toLowerCase()}, and ${actions[1].title.toLowerCase()}. We’ll share results in a few weeks.`,
  }
}
