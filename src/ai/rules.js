// Offline fallback: rule-based moderation + grouping, so the demo works with no API key or no wifi.
import { SUBTEAMS, TEAMS, THEMES } from '../data/seed.js'

const ALLOW_CAPS = new Set(['I', "I'm", "I've", "I'd", "I'll", 'RBC', 'AI', 'ML', 'LLM', 'VPN', 'Teams', 'Slack', 'Toronto', 'Montreal', 'Waterloo', 'Ottawa', 'Vancouver', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Python', 'SQL', 'Jira', 'OK', 'HR', 'Echo', 'Early', 'Talent', 'Capital', 'Markets', 'Tech', 'Ops', 'Data', 'Science', 'Engineering', 'Platform', 'They', 'He', 'She', 'We', 'My', 'The', 'Our', 'It', 'This', 'That', 'Everyone', 'Nobody', 'Someone', 'Everybody', 'Somebody', 'People', 'Week', 'Today', 'Yesterday', 'Honestly', 'Also', 'And', 'But', 'So', 'Then', 'Management', 'Mentor', 'Manager'])

const STOP = new Set('the a an and or but to of in on at for with is are was were be been it this that my me i im ive we our they them their you your so just not no do does did have has had about from as like get got really very still all any more than then there what when who how why can could would should will one'.split(' '))

const THEME_WORDS = {
  Mentorship: ['mentor', 'buddy', 'coach', 'guidance', 'feedback', '1:1', 'one-on-one'],
  Onboarding: ['onboarding', 'laptop', 'access', 'setup', 'first week', 'day 1', 'orientation', 'vpn', 'account', 'ticket'],
  'Team dynamics': ['team', 'meeting', 'standup', 'excluded', 'alone', 'isolated', 'lonely', 'culture', 'colleague', 'remote'],
  'Career growth': ['career', 'return offer', 'full-time', 'learn', 'skill', 'workshop', 'growth', 'future', 'promotion'],
  Wins: ['proud', 'shipped', 'merged', 'presented', 'win', 'made my week', 'praise', 'loved', 'great'],
  Workload: ['workload', 'overtime', 'deadline', 'busy', 'bored', 'nothing to do', 'weekend', 'late', 'crunch', 'tasks'],
}

const CRISIS = /\b(kill myself|suicid\w*|end it all|self[- ]harm|hurt myself|don'?t want to (be here|live)|no reason to live)\b/i
const SENSITIVE = /\b(harass\w*|sexual\w*|inappropriate(ly)? (touch\w*|comment\w*)|discriminat\w*|racis\w*|sexis\w*|homophob\w*|accent|bull(y|ied|ying)|threaten\w*|unwanted|creep\w*|groped?|slur\w*)\b/i
const CONFIDENTIAL = /\b(client (account|data|name|list)s?|account numbers?|merger|acquisition|insider|confidential (deal|client)|SIN number)\b/i
const INSULT = /\b(idiot|moron|stupid|useless|incompetent|pathetic|loser|clown|dumb|trash|garbage|worthless|lazy|clueless|a joke|hate (him|her|them)|sucks?|terrible|awful|horrible|the worst|annoying|toxic|rude|jerk|creep|snake|fake|two-faced|bad at (his|her|their) job|can'?t do anything|has no idea|doesn'?t know what (he|she|they)'?s? doing|waste of)\b/i
const PROFANITY = /\b(f+u+c+k\w*|shit\w*|bullshit|crap|wtf|ass(hole)?s?|bs|piss\w*)\b/i
const PERSON = /\b(manager|mentor|lead|boss|director|buddy|supervisor|teammate|coworker|colleague|he|she|him|her|guy|girl|dude)\b|\[(a person|my \w+)\]/i
const GOSSIP = /\b(i heard|rumou?rs?|apparently (he|she|they)|getting fired|sleeping with|dating (her|him)|drunk at)\b/i
const SIGNALS = {
  we_to_they: /\b(they (always|never|don'?t|just|only)|their team|not (really )?my team|those people)\b/i,
  no_future_talk: /\b(looking elsewhere|other offers?|won'?t (come|be coming) back|not coming back|don'?t see (a|my) future|what'?s the point|thinking of leaving|want to quit|counting down)\b/i,
  shrinking_network: /\b(alone|no ?one|nobody|by myself|only intern|lonely|isolated|don'?t talk to anyone)\b/i,
  disengagement: /\b(don'?t care anymore|bare minimum|checked out|whatever|why bother)\b/i,
}

export const stem = (w) => w.toLowerCase().replace(/[^a-z0-9:-]/g, '').replace(/(ing|ed|es|s)$/, '')
export const tokens = (t) => t.toLowerCase().split(/[^a-z0-9:'-]+/).filter((w) => w && !STOP.has(w)).map(stem)

export function scoreGroups(text, groups) {
  const toks = new Set(tokens(text))
  return groups
    .map((g) => ({ id: g.id, score: g.keywords.map(stem).filter((k) => toks.has(k)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

const FIRST_NAMES = 'aaron abby adam aisha alex alice amanda amy andrew angela anna ashley ayesha ben brandon brian chris christina daniel david emily emma eric ethan fatima grace hannah harry henry isabella jack jacob james jason jennifer jessica john jordan josh julia justin karen kevin kyle laura lily lisa liam lucas maria mark matt matthew megan michael michelle mike mohammed nathan nicole noah olivia omar priya rachel raj rebecca ryan sam sarah sophia steve steven taylor tom tyler victoria wei william zoe'.split(' ')
const NAME_RE = new RegExp(`\\b(${FIRST_NAMES.join('|')})\\b`, 'gi')

export function redact(text) {
  const redactions = []
  let out = text
  const swap = (re, fn) => {
    out = out.replace(re, (...m) => {
      const rep = typeof fn === 'function' ? fn(...m) : fn
      if (rep !== m[0]) redactions.push({ original: m[0], replacement: rep })
      return rep
    })
  }
  swap(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
  swap(/@[a-z][\w.]+/gi, '[a person]')
  swap(/\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/g, '[phone]')
  swap(/\b[Pp]roject [A-Z][\w-]+/g, '[a project]')
  // "my manager Sarah" -> "[my manager]"
  swap(/\b([Mm]y|[Oo]ur) (manager|mentor|lead|buddy|boss|director|supervisor) ([A-Z][a-z]+)( [A-Z][a-z]+)?/g, (_m, p, role) => `[${p} ${role}]`)
  // "Sarah on my team" / "Sarah keeps" / sentence-start names followed by a verb about them
  swap(/\b([A-Z][a-z]{2,})( [A-Z][a-z]+)?(?= (on my team|from my team|keeps|said|told|always|never|yelled|ignores|ignored)\b)/g, (m, name) =>
    ALLOW_CAPS.has(name) ? m : '[a person]')
  // any other capitalized word mid-sentence that isn't a known safe word
  swap(/(?<=[a-z,] )([A-Z][a-z]{2,})(?: [A-Z][a-z]+)?\b/g, (m, name) => (ALLOW_CAPS.has(name) ? m : '[a person]'))
  // common first names, even typed in lowercase
  swap(NAME_RE, (m) => (m === m.toUpperCase() && m.length < 4 ? m : '[a person]'))
  return { text: out, redactions }
}

// Unique details that could point to one person even without a name
const CITIES = /\b(Toronto|Waterloo|Montreal|Vancouver|Calgary|Halifax|Ottawa|Edmonton|Winnipeg|Regina|Victoria|Quebec City)\b/g
const SCHOOLS = /\b(uwaterloo|u of t|uoft|mcgill|ubc|queen'?s|western|mcmaster|laurier|tmu|ryerson|concordia|york u)\b/gi
export function generalize(text) {
  const generalized = []
  let out = text
  const swap = (re, fn) => {
    out = out.replace(re, (...m) => {
      const rep = typeof fn === 'function' ? fn(...m) : fn
      if (rep !== m[0]) generalized.push({ original: m[0], replacement: rep })
      return rep
    })
  }
  swap(/\bthe only (intern|co-?op|new grad|student|woman|girl|guy|person|one)\b/gi, (_m, w) => `one of the few ${w.toLowerCase()}s`)
  swap(/\bI'?m the only one\b/gi, "I'm one of the few")
  // Posts are about situations, never a named team
  swap(new RegExp(`\\b(the )?(${[...TEAMS, ...SUBTEAMS].map((t) => t.replace('&', '\\&')).join('|')})( team)?\\b`, 'gi'), '[a team]')
  swap(/\b[Tt]he ([A-Z][\w&]*(?: [A-Z&][\w&]*)*) team\b/g, '[a team]')
  swap(CITIES, '[my city]')
  swap(SCHOOLS, '[my school]')
  swap(/\b(employee|student) (id|number|#)\s*:?\s*\d+/gi, '[an ID]')
  swap(/\b(on )?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]* \d{1,2}(st|nd|rd|th)?\b/gi, 'recently')
  swap(/\b(on |last |this )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, 'recently')
  swap(/\b(at|around) \d{1,2}(:\d{2})? ?(am|pm)\b/gi, '')
  return { text: out.replace(/ {2,}/g, ' '), generalized }
}

// Writing style is a fingerprint. Smooth the obvious tells so posts can't be matched to a person.
const SLANG = { u: 'you', ur: 'your', r: 'are', tbh: 'honestly', ngl: 'honestly', rn: 'right now', idk: "I don't know", imo: 'I think', pls: 'please', plz: 'please', gonna: 'going to', wanna: 'want to', kinda: 'kind of', bc: 'because', cuz: 'because', w: 'with', smth: 'something' }
export function smoothStyle(text) {
  const changes = new Set()
  let out = text
  const swap = (re, fn, label) => { const next = out.replace(re, fn); if (next !== out) changes.add(label); out = next }
  swap(/\p{Extended_Pictographic}️?/gu, '', 'emoji removed')
  swap(/\b(lol|lmao|lmfao|rofl|ha(ha)+|xd)\b/gi, '', 'filler removed')
  swap(/([!?.])\1+/g, '$1', 'punctuation evened out')
  swap(/\b([A-Za-z])\1{2,}\b|([a-z])\2{2,}/gi, (m) => m[0], 'stretched words fixed')
  swap(/\b[A-Z]{4,}\b/g, (w) => (ALLOW_CAPS.has(w) ? w : w.toLowerCase()), 'all-caps lowered')
  swap(/\b(u|ur|r|tbh|ngl|rn|idk|imo|pls|plz|gonna|wanna|kinda|bc|cuz|w|smth)\b/gi, (w) => SLANG[w.toLowerCase()], 'slang spelled out')
  out = out.replace(/\s+([,.!?])/g, '$1').replace(/ {2,}/g, ' ').trim()
  if (out && /[a-z]/.test(out[0])) out = out[0].toUpperCase() + out.slice(1)
  return { text: out, changes: [...changes] }
}

// One analysis used by the live checklist AND the final decision, so they always agree
export function analyze(text) {
  const { text: r1, generalized } = generalize(text)
  const { text: r2, redactions } = redact(r1)
  const { text: cleaned, changes } = smoothStyle(r2)
  const words = text.trim().split(/\s+/).length
  const hostile = INSULT.test(text) || PROFANITY.test(text)
  let blockKind = ''
  if (CONFIDENTIAL.test(text)) blockKind = 'confidential'
  else if (GOSSIP.test(text)) blockKind = 'gossip'
  else if (hostile && (PERSON.test(text) || redactions.length)) blockKind = 'person'
  else if (PROFANITY.test(text) && words < 10) blockKind = 'vague'
  const crisis = CRISIS.test(text)
  const sensitive = !crisis && SENSITIVE.test(text)
  return { cleaned, redactions, generalized, styleChanges: changes, blockKind, crisis, sensitive, words }
}

export const BLOCK_COPY = {
  person: {
    reason: 'This goes after a person instead of describing what happened, so it can’t be posted. Echo is for fixing things, not trashing people.',
    tips: ['Say what happened: “My questions go unanswered for days.”', 'Say how it affected you: “…so I’m stuck and falling behind.”', 'Say what would help: “A set weekly check-in would fix this.”'],
  },
  gossip: {
    reason: 'This sounds like a rumour about someone else. Echo only allows your own experience, so nobody gets talked about behind their back.',
    tips: ['Share how the situation affects you directly.', 'If someone is being harmed, use “I’d like a follow-up” or report it privately.'],
  },
  vague: {
    reason: 'This is pure venting with no detail, so nobody can act on it. Add what happened and it can be posted.',
    tips: ['What happened?', 'How did it affect your work or how you feel?', 'What would make it better?'],
  },
  confidential: {
    reason: 'This looks like it includes confidential client or bank information, which can’t be shared here.',
    tips: ['Describe the situation without client names, numbers or deal details.'],
  },
}

// ---- Suggested rewrites: turn an attack into the experience behind it ----
const ROLE = /\b(my |our |the )?(manager|mentor|lead|team lead|boss|director|buddy|supervisor|teammate|coworker|colleague)\b/i
const BEHAVIOURS = [
  [/cancel/i, (r) => `${r} keeps cancelling our check-ins, so I'm not getting the guidance I need.`],
  [/(never|doesn'?t|does not|won'?t|rarely) (answer|respond|reply|get back)|ignor(es|ed|ing)? (me|my)|left on read|ghost/i, (r) => `My questions to ${lc(r)} often go unanswered, so I end up stuck.`],
  [/micromanag/i, (r) => `I feel micromanaged by ${lc(r)}, which makes it hard to learn on my own.`],
  [/(takes?|took|steal\w*) (the )?credit/i, () => `My work is sometimes presented without credit to me, which is discouraging.`],
  [/(nothing to do|no work|doesn'?t give me|never gives? me)/i, (r) => `I'm not getting enough meaningful work from ${lc(r)}, and I want to contribute more.`],
  [/(yell|shout|snap|rude|condescend)/i, (r) => `Some of my conversations with ${lc(r)} have felt harsh, and it's making me anxious at work.`],
  [/(late|deadline|overtime|weekend|burn)/i, () => `The workload has me working late, and I don't think it's sustainable.`],
  [/(feedback|no idea how i'?m doing)/i, (r) => `I'm not getting feedback from ${lc(r)}, so I don't know how I'm doing.`],
]
const lc = (r) => r.charAt(0).toLowerCase() + r.slice(1)
const cap = (r) => r.charAt(0).toUpperCase() + r.slice(1)

export function suggestRewrite(text, blockKind) {
  if (blockKind === 'confidential') return ''
  if (blockKind === 'gossip') return "There's a lot of uncertainty on my team right now, and it's affecting how I feel about being here."
  const m = text.match(ROLE)
  const role = m ? `my ${m[2].toLowerCase()}` : 'someone I work with'
  for (const [re, make] of BEHAVIOURS) if (re.test(text)) return cap(make(cap(role)))
  // Fallback: keep any concrete behaviour left after stripping insults, names and filler
  let rest = text
    .replace(INSULT, '').replace(PROFANITY, '').replace(/\b(lol|lmao|tbh|ngl|honestly)\b/gi, '')
    .replace(/\b(is|are|was|so|such|totally|completely|literally)\b( (an?|a total|the most))?\s*(and)?/gi, ' ')
    .replace(/\b[A-Z][a-z]{2,}\b/g, (w) => (ALLOW_CAPS.has(w) ? w : ''))
    .replace(ROLE, '').replace(/\s+/g, ' ').replace(/^[\s,.!-]+|[\s,.!-]+$/g, '')
  const verb = rest.match(/\b(never|always|keeps?|doesn'?t|won'?t|didn'?t|makes?|gives?|tells?|says?|blames?)\b.*$/i)
  if (verb && verb[0].split(' ').length >= 3) return `${cap(role)} ${verb[0].toLowerCase()}, and it's affecting my work.`
  if (blockKind === 'vague' && !m) return "I'm frustrated with how things are going here: [what happened]."
  return `I'm finding it hard to work with ${role}: [what happened, and how it affected you].`
}

// The checklist interns see while typing and after posting
export function shieldChecks(a) {
  const n = (x) => x.length
  return [
    { key: 'names', label: 'Names & contact info', status: n(a.redactions) ? 'fix' : 'ok', detail: n(a.redactions) ? `${n(a.redactions)} will be hidden` : 'None found' },
    { key: 'details', label: 'Details that point to you', status: n(a.generalized) ? 'fix' : 'ok', detail: n(a.generalized) ? `${n(a.generalized)} will be generalized (teams, places, dates, “the only…”)` : 'None found' },
    { key: 'style', label: 'Writing style', status: n(a.styleChanges) ? 'fix' : 'ok', detail: n(a.styleChanges) ? `Will be smoothed (${a.styleChanges.join(', ')})` : 'Nothing distinctive' },
    { key: 'respect', label: 'About a situation, not a person', status: a.blockKind && a.blockKind !== 'confidential' ? 'stop' : 'ok', detail: { person: 'Attacks a person: needs a rewrite', gossip: 'Sounds like a rumour about someone', vague: 'Just venting: add what happened' }[a.blockKind] || 'Looks constructive' },
    { key: 'confidential', label: 'No confidential bank info', status: a.blockKind === 'confidential' ? 'stop' : 'ok', detail: a.blockKind === 'confidential' ? 'Client or deal info found' : 'None found' },
    { key: 'meta', label: 'Time & location', status: 'ok', detail: 'Post time blurred, location only shown if 5+ people share it' },
  ]
}

function guessTheme(text) {
  const t = text.toLowerCase()
  let best = 'Team dynamics', bestN = 0
  for (const th of THEMES) {
    const n = THEME_WORDS[th].filter((w) => t.includes(w)).length
    if (n > bestN) { best = th; bestN = n }
  }
  return best
}

export function rulesModerate(text, groups) {
  const signals = Object.entries(SIGNALS).filter(([, re]) => re.test(text)).map(([k]) => k)
  const a = analyze(text)
  const theme = guessTheme(text)
  const scored = scoreGroups(text, groups)
  const groupId = scored[0]?.score >= 2 ? scored[0].id : ''
  const base = {
    cleaned_text: a.cleaned, redactions: a.redactions, generalized: a.generalized, styleSmoothed: a.styleChanges.length > 0, styleChanges: a.styleChanges,
    theme, group_id: groupId, similar_group_ids: scored.slice(0, 3).map((s) => s.id), new_group_title: groupId ? '' : a.cleaned.split(/[.!?]/)[0].slice(0, 60),
    risk_signals: signals, sensitive_category: '', source: 'rules', checks: shieldChecks(a), blockKind: '', tips: [],
  }
  if (a.crisis) return { ...base, action: 'crisis', reason: 'This sounds really heavy. Your safety matters more than any post.' }
  if (a.blockKind === 'confidential') return { ...base, action: 'block', blockKind: 'confidential', ...BLOCK_COPY.confidential, suggested_rewrite: '' }
  if (a.sensitive) return { ...base, action: 'sensitive', sensitive_category: /sexual|touch|grope/i.test(text) ? 'Sexual harassment' : /racis|discriminat|sexis|homophob|accent|slur/i.test(text) ? 'Discrimination' : 'Harassment', reason: 'This describes possible harassment or discrimination.' }
  if (a.blockKind) return { ...base, action: 'block', blockKind: a.blockKind, ...BLOCK_COPY[a.blockKind], suggested_rewrite: suggestRewrite(text, a.blockKind) }
  const changed = a.redactions.length || a.generalized.length || a.styleChanges.length
  return { ...base, action: changed ? 'redact' : 'allow', reason: changed ? 'We changed a few things to keep you anonymous.' : '' }
}
