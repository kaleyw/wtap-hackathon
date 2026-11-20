// Every post and thread reply goes through moderate() before anyone else can see it.
// With VITE_ANTHROPIC_API_KEY set it uses Claude; otherwise (or on any error) it falls back to rules.js.
import Anthropic from '@anthropic-ai/sdk'
import { THEMES } from '../data/seed.js'
import { analyze, BLOCK_COPY, generalize, rulesModerate, shieldChecks, smoothStyle, suggestRewrite } from './rules.js'

const KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
export const AI_ENABLED = !!KEY

// Local demo only: the key is visible in the browser. Never deploy this build.
const client = KEY ? new Anthropic({ apiKey: KEY, dangerouslyAllowBrowser: true }) : null

const SYSTEM = `You moderate "Echo", an anonymous feedback space for co-op students and new grads in a bank's AI group.
Co-ops and new grads (early talent) post about mentorship, onboarding, team dynamics, career growth and workload. Your job is to protect their anonymity, keep the space safe, and group similar experiences.

Decide one action:
- "allow": fine as written. Venting, frustration and mild swearing are allowed.
- "redact": fine once you remove anything that could identify the poster or another person: names, emails, phone numbers, project codenames, exact dates, or details that make someone unique ("the only intern in Halifax"). Replace with neutral brackets like "[my manager]", "[a person]", "[a project]". Keep the meaning.
- "sensitive": the poster describes harassment, discrimination, bullying, threats or sexual misconduct happening to them or someone else. Still redact names. Set sensitive_category (e.g. "Harassment", "Discrimination", "Sexual harassment", "Bullying").
- "block": the post insults or trashes a specific person ("my manager is useless"), spreads gossip or rumours about someone, is pure venting with no detail anyone could act on, or shares confidential client/bank information. Echo is for fixing things, not trashing people. Explain kindly in reason how to rewrite it.
Posts are about a situation, never a person or a named team: replace team names ("the Payments team", "Applied ML", "Capital Markets") with "[a team]".
When the action is "block" (except for confidential info), write suggested_rewrite: the same complaint rewritten in first person about the experience and its effect, with no names, no team names and no insults. Example: "my mentor is useless, she cancelled AGAIN" -> "My mentor keeps cancelling our check-ins, so I'm not getting the guidance I need." If the post has no concrete detail, keep a short placeholder like "[what happened]". Otherwise suggested_rewrite is "".
Also generalize details that could point to one person even without a name: cities, schools, exact dates and times, "the only intern on my team" -> "one of the few interns".
- "crisis": signs of self-harm or suicidal thoughts. reason should be warm and short.

Also:
- theme: the single best theme.
- group_id: the id of an existing group this clearly belongs to (same underlying problem, even if worded differently), else "".
- similar_group_ids: up to 3 existing group ids that are related, most similar first.
- new_group_title: if group_id is "", a short neutral title (under 8 words) for a new group, else "".
- risk_signals: quiet signs the poster may leave: "we_to_they" (talks about the team as "they", not "we"), "no_future_talk" (looking elsewhere, no future here), "shrinking_network" (alone, nobody to talk to), "disengagement" (stopped caring). Empty if none.
- redactions: each original phrase you replaced and its replacement.
- cleaned_text: the post exactly as it should appear publicly.
- reason: one short sentence shown to the poster, or "" for allow.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'reason', 'cleaned_text', 'redactions', 'theme', 'group_id', 'similar_group_ids', 'new_group_title', 'risk_signals', 'sensitive_category', 'suggested_rewrite'],
  properties: {
    action: { type: 'string', enum: ['allow', 'redact', 'sensitive', 'block', 'crisis'] },
    reason: { type: 'string' },
    cleaned_text: { type: 'string' },
    redactions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['original', 'replacement'], properties: { original: { type: 'string' }, replacement: { type: 'string' } } } },
    theme: { type: 'string', enum: THEMES },
    group_id: { type: 'string' },
    similar_group_ids: { type: 'array', items: { type: 'string' } },
    new_group_title: { type: 'string' },
    risk_signals: { type: 'array', items: { type: 'string', enum: ['we_to_they', 'no_future_talk', 'shrinking_network', 'disengagement'] } },
    sensitive_category: { type: 'string' },
    suggested_rewrite: { type: 'string' },
  },
}

export async function moderate(text, groups) {
  if (!client) return rulesModerate(text, groups)
  try {
    const groupList = groups.map((g) => `${g.id}: ${g.title} (${g.theme})`).join('\n')
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Existing groups:\n${groupList}\n\nNew message:\n${text}` }],
    })
    if (response.stop_reason === 'refusal') return rulesModerate(text, groups)
    const block = response.content.find((b) => b.type === 'text')
    const out = JSON.parse(block.text)
    const ids = new Set(groups.map((g) => g.id))
    if (out.group_id && !ids.has(out.group_id)) out.group_id = ''
    out.similar_group_ids = out.similar_group_ids.filter((id) => ids.has(id))
    // Run the same local anonymizer on Claude's output: generalize details, smooth writing style
    const a = analyze(text)
    const g = generalize(out.cleaned_text)
    const st = smoothStyle(g.text)
    const blockKind = out.action === 'block' ? (a.blockKind || 'person') : ''
    return {
      ...out, cleaned_text: st.text, generalized: g.generalized, styleSmoothed: st.changes.length > 0, styleChanges: st.changes,
      blockKind, tips: blockKind ? BLOCK_COPY[blockKind].tips : [],
      suggested_rewrite: blockKind && blockKind !== 'confidential' ? (out.suggested_rewrite || suggestRewrite(text, blockKind)) : '',
      checks: shieldChecks({ ...a, redactions: out.redactions, generalized: g.generalized, styleChanges: st.changes, blockKind }),
      source: 'claude',
    }
  } catch (err) {
    console.warn('Claude moderation failed, using rules fallback:', err)
    return rulesModerate(text, groups)
  }
}
