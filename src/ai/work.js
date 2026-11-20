// Journal: turn project tasks into (1) a manager-ready impact summary and (2) resume bullets.
// With VITE_ANTHROPIC_API_KEY it asks Claude; otherwise it uses built-in templates (labelled as such in the UI).
import Anthropic from '@anthropic-ai/sdk'

const KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
// Local demo only: the key is visible in the browser. Never deploy this build.
const client = KEY ? new Anthropic({ apiKey: KEY, dangerouslyAllowBrowser: true }) : null

const SCHEMAS = {
  manager: {
    type: 'object', additionalProperties: false,
    required: ['headline', 'talking_points', 'next_ask', 'coaching'],
    properties: {
      headline: { type: 'string' },
      talking_points: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['point', 'evidence'], properties: { point: { type: 'string' }, evidence: { type: 'string' } } } },
      next_ask: { type: 'string' },
      coaching: { type: 'array', items: { type: 'string' } },
    },
  },
  resume: {
    type: 'object', additionalProperties: false,
    required: ['bullets', 'skills'],
    properties: { bullets: { type: 'array', items: { type: 'string' } }, skills: { type: 'array', items: { type: 'string' } } },
  },
}

const PROMPTS = {
  manager: `You coach co-op students (also use their private notes for feedback they received and context Jira lacks) and new grads at a bank to talk about their work with their manager. From their completed and in-progress tasks, write:
- headline: one sentence they could open a 1:1 or midterm with, leading with impact, in first person.
- talking_points: 3-4 points, each a first-person sentence about an outcome (not an activity), with evidence citing the task id and the number or stakeholder.
- next_ask: one first-person sentence asking for a specific next step or more ownership, based on in-progress work.
- coaching: 3 short tips on how they pitched this, so they learn the skill (e.g. lead with the result, quantify, name who benefited).
Only use facts in the tasks. Never invent numbers.`,
  resume: `Write resume bullet points for a co-op student or new grad from their completed project tasks.
- 4-6 bullets, each starting with a strong past-tense verb, in the form "did X using Y, resulting in Z". Under 30 words each.
- Combine related tasks when it makes a stronger bullet. Use only facts and numbers present in the tasks.
- No internal ticket ids, and no confidential client or bank names beyond "a Canadian bank".
- skills: the 5-8 most relevant skills for a resume skills line.`,
}

export async function generate(kind, tasks, notes = []) {
  if (client) {
    try {
      const response = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMAS[kind] } },
        system: PROMPTS[kind],
        messages: [{ role: 'user', content: JSON.stringify({ tasks: tasks.map(({ id, project, title, status, skills, impact, stakeholders }) => ({ id, project, title, status, skills, impact, stakeholders })), my_private_notes: notes.map((n) => ({ week: n.week, ticket: n.taskId, tags: n.tags, text: n.text })) }, null, 2) }],
      })
      if (response.stop_reason !== 'refusal') {
        const block = response.content.find((b) => b.type === 'text')
        return { ...JSON.parse(block.text), source: 'claude' }
      }
    } catch (err) {
      console.warn('Claude generation failed, using template:', err)
    }
  }
  await new Promise((r) => setTimeout(r, 600))
  return { ...(kind === 'manager' ? managerTemplate(tasks, notes) : resumeTemplate(tasks)), source: 'template' }
}

// ---- Built-in templates (no API key) ----
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const which = (impact) => (/^(now )?used\b/.test(impact) ? `which is ${impact}` : `which ${impact}`)
const done = (tasks) => tasks.filter((t) => t.status === 'Done')

function managerTemplate(tasks, notes = []) {
  const d = done(tasks).filter((t) => t.impact)
  const projects = [...new Set(d.map((t) => t.project))]
  const top = [...d].sort((a, b) => (/\d/.test(b.impact) ? 1 : 0) - (/\d/.test(a.impact) ? 1 : 0))
  const next = tasks.find((t) => t.status !== 'Done')
  return {
    headline: `This term I've shipped ${d.length} pieces of work across ${projects.length} project${projects.length > 1 ? 's' : ''}. The biggest result: ${top[0] ? `my work on the ${top[0].project} ${top[0].impact}` : 'my work is in use'}.`,
    talking_points: top.slice(0, 4).map((t) => ({
      point: `I ${t.verb.toLowerCase()} ${t.what}, ${which(t.impact)}.`,
      evidence: `${t.id} · ${t.project}${t.stakeholders ? ` · used by ${t.stakeholders}` : ''}`,
    })),
    feedback: notes.filter((n) => n.tags?.includes('Got feedback')).slice(-2).map((n) => n.text),
    next_ask: next
      ? `Next, I'd like to keep ${next.verb.toLowerCase()} ${next.what}. What would you need to see from me to own more of this?`
      : `I'd like to take on a piece of work I can own end to end next. Is there something on the roadmap that fits?`,
    coaching: [
      'Lead with the result, then explain what you did. Managers remember outcomes.',
      'Use numbers when you have them: hours saved, errors caught, % faster.',
      'Name who benefited (another team, leadership). It shows your work matters beyond your own tasks.',
    ],
  }
}

function resumeTemplate(tasks) {
  const d = done(tasks).filter((t) => t.impact).sort((a, b) => (/\d/.test(b.impact) ? 1 : 0) - (/\d/.test(a.impact) ? 1 : 0))
  const bullets = d.slice(0, 6).map((t) => {
    const TOOLS = ['Python', 'SQL', 'Spark', 'pytest', 'LLM evals']
    const tools = t.skills.filter((s) => TOOLS.includes(s) && !t.what.includes(s))
    return `${cap(t.verb)} ${t.what}${tools.length ? ` using ${tools.join(' and ')}` : ''}, ${which(t.impact)}`.replace(/\bClient Insights\b|\bWealth Management\b/g, 'business').replace(/\.$/, '') + '.'
  })
  const skills = [...new Set(d.flatMap((t) => t.skills))].slice(0, 8)
  return { bullets, skills }
}
