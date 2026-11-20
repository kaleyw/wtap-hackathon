// All data is fake and lives in memory (plus localStorage so a refresh keeps the demo state).

export const TEAMS = ['Technology & Operations', 'Capital Markets', 'Wealth Management', 'General Bank Management', 'Personal & Commercial Banking']
export const THEMES = ['Mentorship', 'Onboarding', 'Team dynamics', 'Career growth', 'Workload', 'Wins']
export const PROBLEM_THEMES = THEMES.filter((t) => t !== 'Wins')

// From the team's mockup: lines of business (with their teams)
export const LOBS = {
  'Technology & Operations': ['Applied ML', 'Data Platforms', 'Cloud & Infra', 'Cyber Security'],
  'Capital Markets': ['Quant Research', 'Trading Tech', 'Risk Analytics', 'Sales Tools'],
  'Wealth Management': ['Advisor Tools', 'Digital Wealth', 'Client Insights', 'Portfolio Tech'],
  'General Bank Management': ['Finance Analytics', 'HR Tech', 'Strategy', 'Enterprise Data'],
  'Personal & Commercial Banking': ['Mobile Banking', 'Lending Tech', 'Fraud & AML', 'Customer AI'],
}
export const LOBSHORT = { 'Technology & Operations': 'T&O', 'Capital Markets': 'Cap Mkts', 'Wealth Management': 'Wealth', 'General Bank Management': 'GBM', 'Personal & Commercial Banking': 'P&CB' }
export const SUBTEAMS = Object.values(LOBS).flat()
// Early talent = co-ops (first to last work term) and new grads (within 2 years of graduating)
export const ROLES = ['Co-op', 'New grad']
export const ESCALATE = 25 // echoes before a post is sent to the Early Talent team automatically
export const COHORT_SIZE = 140
export const K_ANON = 5 // never show a location, team or combo with fewer than 5 interns

export const PROVINCES = { ON: 'Ontario', QC: 'Quebec', BC: 'British Columbia', AB: 'Alberta', NS: 'Nova Scotia' }
export const OFFICES = [
  { name: 'Toronto', province: 'ON' }, { name: 'Waterloo', province: 'ON' }, { name: 'Montreal', province: 'QC' },
  { name: 'Vancouver', province: 'BC' }, { name: 'Calgary', province: 'AB' }, { name: 'Halifax', province: 'NS' },
]
// Interns per office × team (fake). Used to decide what's safe to show.
export const HEADCOUNT = {
  Toronto: { 'Technology & Operations': 20, 'Capital Markets': 16, 'Wealth Management': 16, 'General Bank Management': 14, 'Personal & Commercial Banking': 12 },
  Waterloo: { 'Technology & Operations': 8, 'Wealth Management': 6, 'Personal & Commercial Banking': 6, 'General Bank Management': 2 },
  Montreal: { 'Wealth Management': 4, 'Personal & Commercial Banking': 6, 'General Bank Management': 3, 'Technology & Operations': 3 },
  Vancouver: { 'Wealth Management': 3, 'Personal & Commercial Banking': 5, 'Technology & Operations': 4 },
  Calgary: { 'Personal & Commercial Banking': 3, 'Technology & Operations': 5 },
  Halifax: { 'Personal & Commercial Banking': 2, 'Technology & Operations': 2 },
}
export const CIRCLE_THRESHOLD = 8 // unique people needed before a group opens a Circle (thread)

// The demo user. Their real identity is only ever stored in sealed metadata.
export const ME = { id: 'p-me', alias: 'Quiet Heron', role: 'Co-op', team: 'Technology & Operations', office: 'Waterloo', ava: '🌸', realName: 'Alex Chen', email: 'alex.chen@example.com' }

const fakePeople = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${i}`)
const hoursAgo = (h) => Date.now() - h * 3600_000

export const seedGroups = [
  { id: 'g1', title: 'Mentors are hard to reach', theme: 'Mentorship', keywords: ['mentor', 'buddy', 'reply', 'respond', 'ghost', 'ghosted', 'meeting', 'cancel', 'cancelled', 'reach', 'available'], offices: { Toronto: 12, Waterloo: 4, Montreal: 4, Vancouver: 2, Calgary: 1 }, people: fakePeople('g1', 23), teams: { 'Technology & Operations': 9, 'General Bank Management': 6, 'Personal & Commercial Banking': 5, 'Wealth Management': 3 }, sentiment: -0.6, growth: 0.4 },
  { id: 'g2', title: 'Laptop and system access takes weeks', theme: 'Onboarding', keywords: ['laptop', 'access', 'permission', 'permissions', 'account', 'accounts', 'setup', 'waiting', 'ticket', 'vpn', 'onboarding', 'week'], offices: { Toronto: 14, Waterloo: 7, Montreal: 4, Vancouver: 3, Calgary: 2, Halifax: 1 }, people: fakePeople('g2', 31), teams: { 'Wealth Management': 11, 'Personal & Commercial Banking': 8, 'Technology & Operations': 7, 'Capital Markets': 5 }, sentiment: -0.7, growth: -0.45 },
  { id: 'g3', title: 'No clear path to a return offer', theme: 'Career growth', keywords: ['return', 'offer', 'full-time', 'fulltime', 'convert', 'path', 'career', 'future', 'next', 'term', 'promotion', 'grad'], offices: { Toronto: 9, Waterloo: 5, Montreal: 2, Vancouver: 2 }, people: fakePeople('g3', 18), teams: { 'General Bank Management': 6, 'Capital Markets': 5, 'Personal & Commercial Banking': 4, 'Wealth Management': 3 }, sentiment: -0.5, growth: 0.6 },
  { id: 'g4', title: 'Not enough meaningful work', theme: 'Workload', keywords: ['nothing', 'bored', 'idle', 'tasks', 'work', 'assigned', 'busywork', 'meaningful', 'impact', 'doing'], offices: { Toronto: 5, Calgary: 4, Waterloo: 3, Vancouver: 2 }, people: fakePeople('g4', 14), teams: { 'Technology & Operations': 6, 'Personal & Commercial Banking': 4, 'Wealth Management': 4 }, sentiment: -0.5, growth: 0.3 },
  { id: 'g5', title: 'Left out of team decisions', theme: 'Team dynamics', keywords: ['meetings', 'excluded', 'decisions', 'standup', 'invited', 'invite', 'left', 'out', 'ignored', 'voice'], offices: { Toronto: 7, Waterloo: 2, Montreal: 2 }, people: fakePeople('g5', 11), teams: { 'General Bank Management': 5, 'Technology & Operations': 3, 'Capital Markets': 3 }, sentiment: -0.55, growth: 0.1 },
  { id: 'g6', title: 'Feeling isolated at remote and satellite offices', theme: 'Team dynamics', keywords: ['remote', 'office', 'location', 'alone', 'isolated', 'lonely', 'lunch', 'nobody', 'friends', 'montreal', 'satellite'], offices: { Montreal: 3, Vancouver: 2, Calgary: 2, Halifax: 2 }, people: fakePeople('g6', 9), teams: { 'Personal & Commercial Banking': 4, 'Wealth Management': 3, 'Technology & Operations': 2 }, sentiment: -0.65, growth: 0.5 },
  { id: 'g7', title: 'Crunch before demo days', theme: 'Workload', keywords: ['overtime', 'late', 'deadline', 'crunch', 'weekend', 'night', 'demo', 'pressure', 'burnout'], offices: { Toronto: 7 }, people: fakePeople('g7', 7), teams: { 'Capital Markets': 4, 'General Bank Management': 3 }, sentiment: -0.4, growth: 0.2 },
  { id: 'g8', title: 'The AI workshop series is great', theme: 'Career growth', keywords: ['workshop', 'learned', 'great', 'helpful', 'session', 'loved', 'talk', 'upskilling'], offices: { Toronto: 6, Waterloo: 3, Montreal: 3 }, people: fakePeople('g8', 12), teams: { 'Wealth Management': 4, 'Personal & Commercial Banking': 4, 'General Bank Management': 4 }, sentiment: 0.8, growth: 0.1 },
  { id: 'g9', title: 'Not sure how my work fits in', theme: 'Onboarding', keywords: ['fits', 'fit', 'understand', 'context', 'purpose', 'why', 'does'], offices: { Toronto: 6, Waterloo: 3, Calgary: 2 }, people: fakePeople('g9', 11), teams: { 'Technology & Operations': 6, 'Personal & Commercial Banking': 3, 'Capital Markets': 2 }, sentiment: -0.4, growth: 0.35 },
  { id: 'g10', title: 'Small wins worth sharing', theme: 'Wins', keywords: ['presented', 'merged', 'shipped', 'proud', 'win', 'remembered', 'review', 'lunch', 'lunches', 'praise'], offices: { Toronto: 14, Waterloo: 5, Montreal: 4, Vancouver: 3 }, people: fakePeople('g10', 26), teams: { 'Wealth Management': 8, 'Capital Markets': 8, 'General Bank Management': 6, 'Technology & Operations': 4 }, sentiment: 0.9, growth: 0.2 },
]

export const seedPosts = [
  { id: 'p1', role: 'New grad', ava: '🐻', office: 'Toronto', groupId: 'g2', team: 'Wealth Management', text: "Week 3 and I still don't have access to the data lake. I've filed 4 tickets. I'm basically reading docs all day.", echoes: 27, at: hoursAgo(50), authorId: 'g2-0', followUp: true, reply: { text: 'Thanks for flagging this. We escalated data lake access for every current co-op and new grad, and it should land by Friday. Reply here if it doesn’t.', at: hoursAgo(44) } },
  { id: 'p2', ava: '🦊', office: 'Toronto', groupId: 'g1', team: 'Technology & Operations', text: "My mentor has cancelled our last three 1:1s. I don't want to bug them but I have no idea if I'm doing okay.", echoes: 19, at: hoursAgo(20), authorId: 'g1-0', followUp: true },
  { id: 'p3', ava: '🐼', office: 'Waterloo', groupId: 'g3', team: 'General Bank Management', text: "Does anyone actually know how return offers are decided? Nobody on my team can tell me what 'good' looks like.", echoes: 15, at: hoursAgo(9), authorId: 'g3-0', followUp: true },
  { id: 'p4', ava: '🐰', office: 'Montreal', groupId: 'g8', team: 'Personal & Commercial Banking', text: 'The LLM evals workshop last Thursday was honestly the best thing I have done this term. More of these please!', echoes: 11, at: hoursAgo(30), authorId: 'g8-0', followUp: false },
  { id: 'p5', role: 'New grad', ava: '🐨', office: 'Calgary', groupId: 'g4', team: 'Technology & Operations', text: "I finished my project in week 4 and since then it's been small bug tickets. I came here to learn ML, not to babysit a dashboard.", echoes: 12, at: hoursAgo(14), authorId: 'g4-0', followUp: false },
  { id: 'p6', ava: '🐱', office: 'Halifax', groupId: 'g6', team: 'Personal & Commercial Banking', text: "I'm the only intern at my office. Everyone else on my team is in Toronto. Lunch is me and my laptop.", echoes: 8, at: hoursAgo(6), authorId: 'g6-0', followUp: false },
  { id: 'p7', role: 'New grad', ava: '🦁', office: 'Toronto', groupId: 'g5', team: 'General Bank Management', text: 'Found out in standup that the model architecture changed. Decisions get made in meetings interns are not invited to.', echoes: 9, at: hoursAgo(26), authorId: 'g5-0', followUp: false },
  { id: 'p8', ava: '🐸', office: 'Montreal', groupId: 'g1', team: 'General Bank Management', text: "Got assigned a buddy on day 1 and haven't heard from them since. Not even a Teams message.", echoes: 13, at: hoursAgo(40), authorId: 'g1-1', followUp: false },
  { id: 'p9', role: 'New grad', ava: '🦉', office: 'Toronto', groupId: 'g7', team: 'Capital Markets', text: 'Third weekend in a row working before a demo. I like the team but this pace is not sustainable.', echoes: 6, at: hoursAgo(3), authorId: 'g7-0', followUp: true },
  { id: 'p10', ava: '🐙', office: 'Vancouver', groupId: 'g2', team: 'Technology & Operations', text: 'Laptop arrived on day 6. Then VPN took another week. First two weeks were a write-off.', echoes: 18, at: hoursAgo(70), authorId: 'g2-1', followUp: false },
  { id: 'p11', role: 'New grad', ava: '🐯', office: 'Toronto', groupId: 'g3', team: 'Capital Markets', text: "I'd love to stay but I have no idea if there's even a full-time role on this team. Starting to look elsewhere just in case.", echoes: 10, at: hoursAgo(4), authorId: 'g3-1', followUp: false },
  // ---- posts from the team's mockup ----
  { id: 't1', ava: '🐻', office: 'Toronto', groupId: 'g9', team: 'Technology & Operations', text: "6 weeks in and I still don't really know what my team does or how my work fits in.", echoes: 42, at: hoursAgo(2), authorId: 'g9-0', followUp: true },
  { id: 't2', ava: '🦝', office: 'Toronto', groupId: 'g1', team: 'Capital Markets', text: 'My mentor has cancelled 3 of our 4 check-ins. Is that normal or should I say something?', echoes: 28, at: hoursAgo(5), authorId: 'g1-2', followUp: true },
  { id: 't3', role: 'New grad', ava: '🐇', office: 'Toronto', groupId: 'g10', team: 'Wealth Management', text: 'Presented to a VP today and she remembered my name after. Small thing but it made my week.', echoes: 61, at: hoursAgo(26), authorId: 'g10-0', followUp: false },
  { id: 't4', ava: '🐼', office: 'Waterloo', groupId: 'g3', team: 'Technology & Operations', text: "Nobody's told me what happens after this term. Do co-ops ever move into research teams?", echoes: 19, at: hoursAgo(28), authorId: 'g3-2', followUp: false },
  { id: 't6', ava: '🐨', office: 'Toronto', groupId: 'g2', team: 'Personal & Commercial Banking', text: 'Laptop took 9 days to arrive. Spent my first week reading docs on my phone.', echoes: 23, at: hoursAgo(52), authorId: 'g2-2', followUp: false },
  { id: 't7', role: 'New grad', ava: '🦄', office: 'Toronto', groupId: 'g10', team: 'Capital Markets', text: 'Got my first PR merged into the pricing library. The senior dev left the nicest review comment.', echoes: 33, at: hoursAgo(75), authorId: 'g10-1', followUp: false },
  { id: 't8', ava: '🐧', office: 'Toronto', groupId: 'g3', team: 'Wealth Management', text: 'Would love to know if I can rotate to another team next term. Who do I even ask?', echoes: 17, at: hoursAgo(98), authorId: 'g3-3', followUp: true },
  { id: 't9', ava: '🦋', office: 'Toronto', groupId: 'g1', team: 'Technology & Operations', text: 'Mentorship pairings happened in week 5. Felt like the first month was wasted.', echoes: 38, at: hoursAgo(24 * 100), authorId: 's-1', followUp: true, reply: { text: 'Starting Fall 2026, mentors are matched before your start date.', at: hoursAgo(24 * 90) } },
  { id: 't10', role: 'New grad', ava: '🐳', office: 'Toronto', groupId: 'g10', team: 'General Bank Management', text: 'Our team lunches made this term. Please keep doing them!', echoes: 26, at: hoursAgo(24 * 112), authorId: 's-2', followUp: false },
  { id: 't11', ava: '🐞', office: 'Toronto', groupId: 'g2', team: 'Capital Markets', text: 'Access requests took 3 weeks. I watched other people code for most of January.', echoes: 44, at: hoursAgo(24 * 260), authorId: 'w-1', followUp: true, reply: { text: 'Access requests are now filed 2 weeks before your start date.', at: hoursAgo(24 * 250) } },
  { id: 't12', ava: '🐢', office: 'Toronto', groupId: 'g3', team: 'Wealth Management', text: "Return-offer timelines were really unclear. I accepted somewhere else because I couldn't wait.", echoes: 31, at: hoursAgo(24 * 275), authorId: 'w-2', followUp: true, reply: { text: 'Return-offer decisions now go out by week 12, with a timeline shared in week 1.', at: hoursAgo(24 * 265) } },
]

export const seedThreads = {
  g2: [
    { id: 't1', alias: 'Bright Finch', text: 'Same here, my access ticket got bounced between two queues.', at: hoursAgo(48) },
    { id: 't2', alias: 'Calm Lynx', text: 'Tip: ask your manager to escalate to the onboarding lead, mine got approved in a day after that.', at: hoursAgo(47) },
    { id: 't3', alias: 'Early Talent team', staff: true, text: "Thanks all. We're piloting pre-provisioned laptops and access for the January cohort. Details on the You said, we did board.", at: hoursAgo(30) },
  ],
  g1: [
    { id: 't4', alias: 'Silver Wren', text: "Honestly I thought it was just me. Glad I'm not the only one.", at: hoursAgo(18) },
    { id: 't5', alias: 'Bold Marten', text: 'Mine is great but super overloaded, she mentors 4 people. Maybe the ratio is the real issue?', at: hoursAgo(16) },
    { id: 't6', alias: 'Amber Kite', text: 'Suggestion: a backup mentor from another team so you always have someone.', at: hoursAgo(12), fix: true, fixVotes: 14 },
  ],
}

export const seedActions = [
  { id: 'a0', groupId: 'g9', echoes: 40, response: '40+ of you echoed that onboarding felt confusing. Starting in January, everyone new gets a week-1 buddy from the last term.', status: 'in progress', at: hoursAgo(10), impact: 'Onboarding posts down 45% where it was piloted' },
  { id: 'a1', groupId: 'g2', echoes: 31, response: 'You told us access takes weeks. Starting in January, laptops and core access are set up before day 1, and everyone gets one onboarding contact.', status: 'done', at: hoursAgo(30), impact: 'Onboarding posts down 45% in the 2 weeks since' },
  { id: 'a2', groupId: 'g8', echoes: 12, response: "You loved the AI workshop series, so we're doubling it to every two weeks and recording sessions for other offices.", status: 'in progress', at: hoursAgo(20), impact: 'Workshop attendance up 30%' },
]

// Week-by-week interns showing leaving signals (anonymous counts only)
export const riskByWeek = [
  { week: 'W1', atRisk: 2, lastTerm: 3 }, { week: 'W2', atRisk: 3, lastTerm: 4 }, { week: 'W3', atRisk: 5, lastTerm: 6 },
  { week: 'W4', atRisk: 6, lastTerm: 7 }, { week: 'W5', atRisk: 7, lastTerm: 9 }, { week: 'W6', atRisk: 9, lastTerm: 13 },
  { week: 'W7', atRisk: 8, lastTerm: 12 }, { week: 'W8', atRisk: 11, lastTerm: 11 },
]

export const riskByTeam = [
  { team: 'Technology & Operations', count: 4 }, { team: 'General Bank Management', count: 3 }, { team: 'Capital Markets', count: 2 },
  { team: 'Personal & Commercial Banking', count: 1 }, { team: 'Wealth Management', count: 1 },
]

export const riskDrivers = [
  { signal: 'Shrinking network (mentions fewer people)', pct: 62 },
  { signal: '"We" turning into "they"', pct: 48 },
  { signal: 'Talk about the future disappearing', pct: 41 },
  { signal: 'Fewer posts and echoes (disengaging)', pct: 27 },
]

export const nudgeFunnel = [
  { step: 'Nudges sent', n: 24 }, { step: 'Opened', n: 19 }, { step: 'Chatted with other early talent', n: 9 }, { step: 'Revealed to a coordinator', n: 4 },
]

// Seeded sensitive case: posted anonymously, identity sealed in metadata for investigation.
export const seedSensitive = [
  {
    id: 's1', postId: 'p-s1', category: 'Harassment', team: 'General Bank Management', at: hoursAgo(28),
    text: '[A senior team member] keeps making jokes about my accent in standup. Everyone laughs and I just stay quiet.',
    sealed: { name: 'Jordan Lee', email: 'jordan.lee@example.com', team: 'General Bank Management', alias: 'Pale Sparrow' },
    unsealed: false, audit: [],
  },
]

// Running totals for the Echo Shield card (this week, before the demo starts)
export const SHIELD_BASE = { checked: 412, names: 63, details: 21, style: 188, blockedPerson: 9, rewritten: 7, confidential: 2, crisis: 1 }

export const RISK_SIGNAL_LABELS = {
  we_to_they: '"We" turning into "they"',
  no_future_talk: 'Talk about the future disappearing',
  shrinking_network: 'Mentioning fewer people',
  disengagement: 'Disengaging from the work',
}

// ---- The demo intern's own history this term (private; powers their Wrapped) ----
export const MY_HISTORY = [
  { week: 1, theme: 'Onboarding', mood: -1, text: 'Still waiting on my laptop. Reading docs all day.' },
  { week: 2, theme: 'Onboarding', mood: 1, text: 'Finally got access and shipped my first SQL query!', moment: 'Shipping your first query' },
  { week: 3, theme: 'Career growth', mood: 2, text: 'Presented my churn analysis at team sync and people asked real questions.', moment: 'Presenting your work' },
  { week: 4, theme: 'Mentorship', mood: 1, text: 'My mentor spent an hour walking me through dbt. So helpful.' },
  { week: 5, theme: 'Workload', mood: -1, text: 'Quiet week. Not much to do.' },
  { week: 6, theme: 'Mentorship', mood: -2, text: 'Mentor cancelled again. Feeling a bit lost.' },
  { week: 7, theme: 'Career growth', mood: 2, text: 'The LLM evals workshop was the best thing this term.', moment: 'The LLM evals workshop' },
  { week: 8, theme: 'Career growth', mood: 2, text: 'Presented at demo day! Director asked for the deck.', moment: 'Presenting your work' },
]

export const MY_WRAPPED_EXTRAS = {
  echoesGiven: 31,
  echoTeams: 4,
  echoesReceived: 47,
  peopleMentioned: 12, // counted on the intern's device before names are stripped; never stored
  skills: [{ name: 'SQL', n: 6 }, { name: 'Python', n: 4 }, { name: 'LLM evals', n: 3 }, { name: 'dbt', n: 2 }],
  topFix: { text: 'A backup mentor from another team', votes: 14 },
}

// ---- Anonymous totals from everyone's Wrapped: the program's end-of-term report ----
export const PROGRAM_WRAPPED = {
  responses: 118,
  returnIntent: { yes: 72, maybe: 31, no: 15 },
  energizers: [
    { label: 'Presenting their work', pct: 34 },
    { label: 'Workshops & learning sessions', pct: 27 },
    { label: 'Shipping something real', pct: 21 },
    { label: 'Team socials', pct: 18 },
  ],
  skills: ['SQL', 'Python', 'LLM evals', 'Cloud basics', 'dbt'],
  avgPeopleMentioned: 11,
  dipWeek: 6,
  returnByTheme: [
    { theme: 'Had a responsive mentor', yes: 78 },
    { theme: 'Mentor was hard to reach', yes: 41 },
    { theme: 'Presented at least once', yes: 74 },
    { theme: 'Never presented', yes: 48 },
  ],
}

// ---- My Work: sample tasks from project tools (demo data; real version uses each tool's API with company sign-in) ----
export const WORK_SOURCES = [
  { id: 'jira', name: 'Jira', detail: 'EVAL board · Applied ML', connected: true },
  { id: 'github', name: 'GitHub Projects', detail: 'rbc-ai/feature-store', connected: true },
  { id: 'ado', name: 'Azure DevOps', detail: 'Client Insights', connected: false },
]
// status: 'To do' | 'In progress' | 'Done'; days = days in the current status; kind = 'tech' | 'admin'
export const WORK_TASKS = [
  { id: 'EVAL-142', source: 'jira', project: 'LLM evaluation pipeline', title: 'Build automated eval harness for the credit-risk summarizer', status: 'Done', week: 3, kind: 'tech', skills: ['Python', 'LLM evals'], verb: 'Built', what: 'an automated evaluation harness for a credit-risk summarization model', impact: 'cut manual review from 6 hours to 45 minutes per release', stakeholders: 'Model risk team' },
  { id: 'EVAL-157', source: 'jira', project: 'LLM evaluation pipeline', title: 'Add hallucination checks to the eval suite', status: 'Done', week: 5, kind: 'tech', skills: ['Python', 'Prompt engineering'], verb: 'Added', what: 'automated hallucination checks to the model evaluation suite', impact: 'caught 23 factual errors before the v2 launch', stakeholders: 'Applied ML team' },
  { id: 'EVAL-163', source: 'jira', project: 'LLM evaluation pipeline', title: 'Model quality metrics dashboard', status: 'Done', week: 6, kind: 'tech', skills: ['SQL', 'Data visualization'], verb: 'Designed', what: 'a model quality metrics dashboard', impact: 'now used by 3 teams in weekly model reviews', stakeholders: '3 ML teams' },
  { id: 'EVAL-171', source: 'jira', project: 'LLM evaluation pipeline', title: 'Run evals on production data (needs prod access)', status: 'In progress', days: 12, blocked: true, week: 7, kind: 'tech', skills: ['Python'], verb: 'Running', what: 'model evaluations on production data', impact: '', stakeholders: 'Applied ML team' },
  { id: 'EVAL-175', source: 'jira', project: 'LLM evaluation pipeline', title: 'Regression tests for prompt templates', status: 'To do', week: 8, kind: 'tech', skills: ['Python'], verb: 'Adding', what: 'regression tests for prompt templates', impact: '', stakeholders: 'Applied ML team' },
  { id: 'OPS-31', source: 'jira', project: 'Team admin', title: 'Format the Q4 deck for steering committee', status: 'Done', week: 7, kind: 'admin', skills: [], verb: 'Formatted', what: 'the Q4 steering committee deck', impact: '', stakeholders: '' },
  { id: 'OPS-34', source: 'jira', project: 'Team admin', title: 'Update the weekly meeting notes template', status: 'In progress', days: 6, week: 8, kind: 'admin', skills: [], verb: 'Updating', what: 'the weekly meeting notes template', impact: '', stakeholders: '' },
  { id: 'OPS-36', source: 'jira', project: 'Team admin', title: 'Book rooms for the team offsite', status: 'To do', week: 8, kind: 'admin', skills: [], verb: 'Booking', what: 'rooms for the team offsite', impact: '', stakeholders: '' },
  { id: '#88', source: 'github', project: 'Feature store', title: 'Optimize the nightly feature backfill job', status: 'Done', week: 4, kind: 'tech', skills: ['SQL', 'Spark'], verb: 'Optimized', what: 'a nightly feature backfill job in Spark', impact: 'cut runtime 40%, from 2.5 hours to 1.5 hours', stakeholders: 'Data Platforms' },
  { id: '#91', source: 'github', project: 'Feature store', title: 'Unit tests for feature validators', status: 'Done', week: 5, kind: 'tech', skills: ['Python', 'pytest'], verb: 'Wrote', what: 'unit tests for the feature validation library', impact: 'raised test coverage from 52% to 81%', stakeholders: 'Data Platforms' },
  { id: '#97', source: 'github', project: 'Feature store', title: 'Onboarding guide for the feature store', status: 'Done', week: 6, kind: 'tech', skills: ['Documentation'], verb: 'Wrote', what: 'an onboarding guide for the feature store', impact: 'used by 6 new joiners so far', stakeholders: 'New joiners' },
  { id: '#102', source: 'github', project: 'Feature store', title: 'Migrate validators to pydantic v2', status: 'To do', week: 8, kind: 'tech', skills: ['Python'], verb: 'Migrating', what: 'validators to pydantic v2', impact: '', stakeholders: 'Data Platforms' },
  { id: 'AB#2210', source: 'ado', project: 'Client segmentation', title: 'Data quality checks for client segmentation', status: 'Done', week: 2, kind: 'tech', skills: ['SQL'], verb: 'Implemented', what: 'data quality checks for a client segmentation pipeline', impact: 'flagged 4% duplicate client records before modelling', stakeholders: 'Client Insights' },
  { id: 'AB#2234', source: 'ado', project: 'Client segmentation', title: 'Present churn analysis to Wealth leadership', status: 'Done', week: 3, kind: 'tech', skills: ['Presenting', 'Analytics'], verb: 'Presented', what: 'a client churn analysis to Wealth Management leadership', impact: 'informed the Q1 retention campaign', stakeholders: 'Wealth leadership' },
]

// Private notes: on a ticket (taskId) or general (null). The wording shifts over the term on purpose for the demo.
export const NOTE_TAGS = ['Shipped', 'Learned', 'Got feedback', 'Blocked', 'Felt left out']
export const CURRENT_WEEK = 8
export const SEED_NOTES = [
  { id: 'n1', week: 2, taskId: null, tags: ['Learned'], text: 'First real week. We ran our first eval together and Priya walked me through how everything fits.' },
  { id: 'n2', week: 3, taskId: 'EVAL-142', tags: ['Shipped'], text: "Finished the harness! Priya and Marco reviewed it and we're using it for the next release." },
  { id: 'n3', week: 3, taskId: 'AB#2234', tags: ['Got feedback'], text: 'Presented the churn analysis. The director asked for the deck afterwards, which felt amazing.' },
  { id: 'n4', week: 4, taskId: '#88', tags: ['Shipped', 'Got feedback'], text: 'Backfill job is 40% faster. The Data Platforms lead said it saved our team a headache.' },
  { id: 'n5', week: 5, taskId: 'EVAL-157', tags: ['Shipped'], text: "Hallucination checks caught 23 errors. Excited to keep going on evals, hoping to come back next term." },
  { id: 'n6', week: 6, taskId: null, tags: ['Blocked'], text: 'Mentor cancelled again. They keep moving our check-ins.' },
  { id: 'n7', week: 7, taskId: 'OPS-31', tags: [], text: "Spent most of the day formatting the Q4 deck again. They moved the sprint demo so I didn't get to present." },
  { id: 'n8', week: 7, taskId: null, tags: ['Felt left out'], text: 'Had lunch alone because everyone was in meetings.' },
  { id: 'n9', week: 8, taskId: 'EVAL-171', tags: ['Blocked'], text: 'Still waiting on prod data access. Blocked for over a week now.' },
  { id: 'n10', week: 8, taskId: 'OPS-34', tags: [], text: "More admin. Not sure this is what I'm here for." },
]
