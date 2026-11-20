// Private "how you're doing" read, from two things only the person can see:
//   1. their own notes: wording and how it shifts over the term
//   2. their Jira / GitHub / Azure DevOps progression
// Every conclusion comes with the reasons behind it. Nothing here is shown to anyone else;
// the Early Talent team only ever sees anonymous totals for groups of 5+.

const WE = /\b(we|our|us|together)\b/gi
const THEY = /\b(they|them|their)\b/gi
const PEOPLE = /\b(mentor|manager|lead|director|teammates?|team|priya|marco|[A-Z][a-z]+ (?:said|reviewed|walked|asked))\b/g
const FUTURE = /\b(next term|next sprint|come back|return offer|future|long[- ]term|hoping|excited to)\b/i
const POS = /\b(finished|shipped|excited|amazing|loved|thanked|saved|faster|caught|walked me through|great|proud|fun)\b/gi
const NEG = /\b(blocked|stuck|waiting|alone|frustrat\w*|again|not sure|admin|cancel\w*|ignored|lost|tired|pointless)\b/gi

const count = (re, text) => (text.match(re) || []).length
const join = (notes) => notes.map((n) => n.text).join(' ')

export function readFeelings(notes, tasks, currentWeek) {
  const early = notes.filter((n) => n.week <= Math.max(3, currentWeek - 4))
  const recent = notes.filter((n) => n.week >= currentWeek - 2)
  const E = join(early), R = join(recent)
  const reasons = []

  // 1. "we" turning into "they"
  const weE = count(WE, E), theyE = count(THEY, E), weR = count(WE, R), theyR = count(THEY, R)
  if (theyR > weR && weE >= theyE) reasons.push({ key: 'they', kind: 'wording', text: `You used to write “we” (${weE}× early on). Lately it’s mostly “they” (${theyR}×) when you talk about your team.` })

  // 2. fewer people mentioned
  const pE = count(PEOPLE, E) / Math.max(1, early.length), pR = count(PEOPLE, R) / Math.max(1, recent.length)
  if (early.length && recent.length && pR < pE * 0.6) reasons.push({ key: 'people', kind: 'wording', text: `Your notes mention fewer people than they used to (${pE.toFixed(1)} per note early on, ${pR.toFixed(1)} lately).` })

  // 3. the future disappearing
  const futureEarly = early.some((n) => FUTURE.test(n.text)) || notes.filter((n) => n.week < currentWeek - 2).some((n) => FUTURE.test(n.text))
  if (futureEarly && !recent.some((n) => FUTURE.test(n.text))) reasons.push({ key: 'future', kind: 'wording', text: 'You talked about next term and coming back earlier. That hasn’t come up in your recent notes.' })

  // 4. tone of recent notes
  const neg = count(NEG, R), pos = count(POS, R)
  if (neg >= 3 && neg > pos * 2) {
    const words = [...new Set((R.match(NEG) || []).map((w) => w.toLowerCase()))].slice(0, 3)
    reasons.push({ key: 'tone', kind: 'wording', text: `Recent notes lean frustrated (“${words.join('”, “')}”).` })
  }

  // 5. Jira: stuck work
  const stuck = tasks.filter((t) => t.status === 'In progress' && (t.days || 0) >= 10)
  stuck.forEach((t) => reasons.push({ key: `stuck-${t.id}`, kind: 'work', taskId: t.id, text: `${t.id} has been in progress for ${t.days} days${t.blocked ? ' and is marked blocked' : ''}.` }))

  // 6. Jira: less finished, more admin
  const doneEarly = tasks.filter((t) => t.status === 'Done' && t.kind === 'tech' && t.week <= currentWeek - 3).length
  const doneRecent = tasks.filter((t) => t.status === 'Done' && t.kind === 'tech' && t.week > currentWeek - 3).length
  const recentTasks = tasks.filter((t) => t.week >= currentWeek - 1)
  const adminShare = recentTasks.length ? recentTasks.filter((t) => t.kind === 'admin').length / recentTasks.length : 0
  if (adminShare >= 0.4) reasons.push({ key: 'admin', kind: 'work', text: `${Math.round(adminShare * 100)}% of your recent tickets are admin work (decks, templates, room bookings) rather than technical work.` })
  if (doneEarly >= 3 && doneRecent <= 1) reasons.push({ key: 'pace', kind: 'work', text: `You finished ${doneEarly} technical tickets in your first weeks and ${doneRecent} in the last 2. That usually means something’s in the way, not you.` })

  const level = reasons.length >= 4 ? 'tough' : reasons.length >= 2 ? 'mixed' : 'good'
  const blockedTask = stuck.find((t) => t.blocked)
  return {
    level,
    headline: {
      tough: 'It looks like the last couple of weeks have been rough.',
      mixed: 'Some things are going well, and a few are worth keeping an eye on.',
      good: 'You seem to be in a good place. Keep logging your wins.',
    }[level],
    reasons,
    managerAsk: blockedTask
      ? `I've been blocked on ${blockedTask.id} for ${blockedTask.days} days waiting on access. Could you help me escalate it? I'd also love to take on more technical work like my eval projects.`
      : 'I’d love to take on more technical work and own something end to end. Is there something coming up that fits?',
    weeks: weekly(notes, tasks, currentWeek),
  }
}

// Simple per-week energy from notes (positive vs negative words) plus finished technical work
function weekly(notes, tasks, currentWeek) {
  return Array.from({ length: currentWeek - 1 }, (_, i) => i + 2).map((w) => {
    const t = join(notes.filter((n) => n.week === w))
    const done = tasks.filter((x) => x.status === 'Done' && x.kind === 'tech' && x.week === w).length
    const score = count(POS, t) - count(NEG, t) + done * 0.5
    return { week: w, score, hasData: !!t || !!done }
  })
}
