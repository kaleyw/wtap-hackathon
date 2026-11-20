import { Handshake, Heart, Inbox, LifeBuoy, Loader2, Sparkles, Sprout } from 'lucide-react'
import { suggestFixes } from '../ai/suggest'
import { AI_ENABLED } from '../ai/moderate'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EyeOff, Gift, Lock, MessageCircle, Reply, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react'
import { useStore } from '../store'
import { CIRCLE_THRESHOLD, COHORT_SIZE, ESCALATE, K_ANON, LOBSHORT, PROBLEM_THEMES, PROGRAM_WRAPPED, nudgeFunnel, riskByTeam, riskByWeek, riskDrivers } from '../data/seed'
import { audienceSize, bigOffices, matchesLocation, safeLocation } from '../lib'
import { Badge, Button, Card, Highlighted, THEME_TONE, ThemePill, timeAgo, toast } from './ui'
import Circle from './Circle'
import Filters from './Filters'

const BRAND = 'var(--navy-2)'
const axis = { fontSize: 11, fill: 'var(--muted)' }

/* ---------------- the team's charts ---------------- */

function Heatmap({ groups, rows, byOffice }) {
  const cell = {}
  let max = 1
  for (const g of groups) {
    if (g.sentiment > 0) continue
    for (const [row, n] of Object.entries(byOffice ? g.offices || {} : g.teams)) {
      const k = `${row}|${g.theme}`
      cell[k] = (cell[k] || 0) + n
      max = Math.max(max, cell[k])
    }
  }
  return (
    <div className="hm" style={{ gridTemplateColumns: `${byOffice ? '110px' : '170px'} repeat(${PROBLEM_THEMES.length},1fr)` }}>
      <div />
      {PROBLEM_THEMES.map((t) => <div key={t} className="ch">{t}</div>)}
      {rows.map((r) => (
        <Row key={r} r={r} cell={cell} max={max} />
      ))}
    </div>
  )
}
function Row({ r, cell, max }) {
  return (
    <>
      <div className="rh">{r}</div>
      {PROBLEM_THEMES.map((th) => {
        const v = cell[`${r}|${th}`] || 0
        const hidden = v > 0 && v < K_ANON
        const k = hidden || !v ? 1 : Math.min(7, 1 + Math.floor((v / max) * 6.99))
        return (
          <div key={th} className="c" title={hidden ? 'Fewer than 5 people: hidden to protect anonymity' : `${r} × ${th}: ${v} people raising or echoing problems`}
            style={{ background: `var(--seq-${k})`, color: k >= 5 ? 'var(--brand-ink)' : 'var(--ink)' }}>{hidden ? '<5' : v || ''}</div>
        )
      })}
    </>
  )
}

// Their risk-by-week line with danger bands (midterms, return-offer season); weeks 1-8 actual, rest projected
function RiskChart() {
  const n = 16, nowW = riskByWeek.length
  const shape = [2, 3, 3, 4, 6, 10, 8, 7, 8, 11, 13, 15, 14, 12, 9, 6]
  const series = shape.map((v, i) => (i < nowW ? riskByWeek[i].atRisk : Math.round(v * 1.05)))
  const ymax = 16, W = 560, H = 220, pl = 30, pr = 12, pt = 16, pb = 26
  const x = (i) => pl + (i * (W - pl - pr)) / (n - 1), y = (v) => pt + ((ymax - v) * (H - pt - pb)) / ymax
  const line = (arr, off) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i + off)},${y(v)}`).join('')
  const act = series.slice(0, nowW), proj = series.slice(nowW - 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Early talent showing leaving signals by week">
      <rect x={x(4.5)} y={pt} width={x(6.5) - x(4.5)} height={H - pt - pb} rx="8" fill="var(--pink-soft)" />
      <rect x={x(10.5)} y={pt} width={x(13.5) - x(10.5)} height={H - pt - pb} rx="8" fill="var(--pink-soft)" />
      {[0, 1, 2, 3, 4].map((k) => { const v = (ymax * k) / 4; return <g key={k}><line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={k ? 'var(--grid)' : 'var(--axis)'} /><text x={pl - 6} y={y(v) + 4} textAnchor="end">{v}</text></g> })}
      <text x={x(5.5)} y={pt + 14} textAnchor="middle">midterms</text>
      <text x={x(12)} y={pt + 14} textAnchor="middle">return offers</text>
      {Array.from({ length: n / 2 }, (_, k) => k * 2).map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor="middle">W{i + 1}</text>)}
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--navy-2)" stopOpacity=".25" /><stop offset="1" stopColor="var(--navy-2)" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line(act, 0)}L${x(nowW - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="url(#ga)" />
      <path d={line(proj, nowW - 1)} fill="none" stroke="var(--navy-2)" strokeWidth="2" strokeDasharray="4 4" opacity=".6" />
      <text x={x(13)} y={y(proj[5] || 0) - 10} textAnchor="middle">projected</text>
      <path d={line(act, 0)} fill="none" stroke="var(--navy-2)" strokeWidth="2" />
      <circle cx={x(nowW - 1)} cy={y(act[nowW - 1])} r="5" fill="var(--pink)" stroke="var(--surface)" strokeWidth="2" />
      <text x={x(nowW - 1) + 8} y={y(act[nowW - 1]) - 9} style={{ fill: 'var(--ink)', fontWeight: 700 }}>{act[nowW - 1]} now</text>
      {series.map((v, i) => <rect key={i} x={x(i) - 15} y={pt} width={30} height={H - pt - pb} fill="transparent"><title>{`Week ${i + 1}: ${v} people ${i < nowW ? 'showing signals' : '(projected)'}`}</title></rect>)}
    </svg>
  )
}

const CANNED = {
  Mentorship: 'Every co-op and new grad now gets a backup mentor, and missed check-ins are flagged to the program team.',
  Onboarding: 'Laptops and access are now ready before day one. Each team also runs a 30-minute "how your work fits" session for everyone new.',
}

/* ---------------- your panels ---------------- */

function Section({ title, sub, children, right }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="m-0 text-[22px] font-bold tracking-tight">{title}</h2>{sub && <p className="sub">{sub}</p>}</div>{right}
      </div>
      {children}
    </section>
  )
}

function Respond({ group }) {
  const { dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(`${group.people.length} of you told us "${group.title.toLowerCase()}". Here's what we're doing: `)
  if (!open) return <button className="btn small pink" onClick={() => setOpen(true)}>Respond</button>
  return (
    <div className="mt-2 w-full">
      <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 70, marginTop: 4 }} />
      <div className="mt-1 flex gap-2"><button className="btn small" onClick={() => { dispatch({ type: 'STAFF_RESPOND', groupId: group.id, text }); setOpen(false); toast('Response posted to “You said, we did”') }}>Post to “You said, we did”</button><button className="link" onClick={() => setOpen(false)}>Cancel</button></div>
    </div>
  )
}

function SensitiveCase({ c }) {
  const { dispatch } = useStore()
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge tone="purple"><ShieldAlert size={12} /> {c.category}</Badge><span>{c.team}</span><span>· {c.where || 'Post'}</span><span>· {timeAgo(c.at)}</span>
      </div>
      <p className="mt-2 text-sm"><Highlighted text={c.text} /></p>
      {c.unsealed ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm">
          <div className="flex items-center gap-1 font-bold text-red-700"><Unlock size={14} /> Identity unsealed for investigation</div>
          <div className="mt-1">{c.sealed.name} · {c.sealed.email} · {c.sealed.team} (alias “{c.sealed.alias}”)</div>
          {c.audit.map((a, i) => <div key={i} className="mt-1 text-xs text-red-700">Logged: {a.by}, {timeAgo(a.at)}. Reason: “{a.reason}”</div>)}
        </div>
      ) : asking ? (
        <div className="mt-3 rounded-2xl bg-slate-50 p-3">
          <label className="text-xs font-semibold text-slate-600">Reason for unsealing (logged and visible to the poster)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Formal harassment investigation #2026-114" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm" />
          <div className="mt-2 flex gap-2"><button className="btn small pink" disabled={reason.trim().length < 8} onClick={() => dispatch({ type: 'UNSEAL', id: c.id, reason })}>Unseal identity</button><button className="link" onClick={() => setAsking(false)}>Cancel</button></div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-violet-50 p-3 text-sm text-violet-700">
          <span className="flex items-center gap-1 font-semibold"><Lock size={14} /> Identity sealed</span>
          <button className="btn ghost small" onClick={() => setAsking(true)}>Unseal for investigation…</button>
        </div>
      )}
    </div>
  )
}

function ShieldCard() {
  const { state } = useStore()
  const sh = state.shield
  const items = [
    ['Messages checked', sh.checked, 'Every post and Circle reply, before anyone sees it'],
    ['Names & contact info removed', sh.names, 'Names, emails, phone numbers, project codenames'],
    ['Identifying details generalized', sh.details, 'Teams, cities, schools, exact dates, “the only intern…”'],
    ['Writing styles smoothed', sh.style, 'Emoji, slang, caps and quirks that reveal who wrote it'],
    ['Stopped for attacking a person or gossip', sh.blockedPerson, `${sh.rewritten} were rewritten constructively and posted`],
    ['Stopped for confidential info', sh.confidential, 'Client or deal details'],
    ['Crisis support shown', sh.crisis, 'Not posted; resources shown privately'],
  ]
  return (
    <Section title={<span className="flex items-center gap-2"><ShieldCheck size={20} className="text-brand" /> Echo Shield this week</span>} sub="The AI filter that keeps Echo anonymous and constructive. You see counts only, never the blocked text.">
      <div className="card grid gap-px overflow-hidden bg-slate-200 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, n, sub]) => (
          <div key={label} className="bg-white p-4">
            <div className="text-[28px] font-extrabold tabular-nums">{n}</div>
            <div className="text-sm font-bold">{label}</div>
            <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
          </div>
        ))}
        <div className="bg-white p-4 text-xs leading-relaxed text-slate-600"><b>Also on every post:</b> time blurred to “today / this week”, location shown only when {K_ANON}+ people share it, and no name, email, IP or device stored.</div>
      </div>
    </Section>
  )
}

function FollowUps({ f }) {
  const { state, dispatch } = useStore()
  const [drafts, setDrafts] = useState({})
  const themeOf = (p) => state.groups.find((g) => g.id === p.groupId)?.theme
  const asks = state.posts.filter((p) => p.followUp && (!f.role || (p.role || 'Co-op') === f.role) && (!f.lob || p.team === f.lob) && matchesLocation(p.office, f.province, f.office))
  const waiting = asks.filter((p) => !p.reply).sort((a, b) => b.echoes - a.echoes)
  return (
    <Section title={`Asked for a follow-up (${waiting.length} waiting)`} sub="Early talent who chose “I’d like a follow-up”. Your reply appears under their post. They stay anonymous.">
      {waiting.length === 0 ? <div className="card sub">Everyone who asked has had a reply.</div> : (
        <div className="grid2">
          {waiting.map((p) => (
            <div key={p.id} className="card">
              <div className="row"><ThemePill theme={themeOf(p)} style={{ margin: 0 }} /><span className="sub">{p.team} · {safeLocation(p.team, p.office)} · {p.echoes} echoes</span></div>
              <p className="ptext" style={{ fontSize: 15 }}><Highlighted text={p.text} /></p>
              <textarea value={drafts[p.id] || ''} onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })} placeholder="Reply publicly under this post…" style={{ minHeight: 70 }} />
              <button className="btn small" style={{ marginTop: 8 }} disabled={!(drafts[p.id] || '').trim()} onClick={() => { dispatch({ type: 'STAFF_REPLY_POST', postId: p.id, text: drafts[p.id] }); toast('Reply posted under their post ✓') }}><Reply size={13} /> Reply</button>
            </div>
          ))}
        </div>
      )}
      <p className="sub" style={{ marginTop: 8 }}>{asks.length - waiting.length} of {asks.length} follow-up requests answered.</p>
    </Section>
  )
}

function EndOfTermReport() {
  const { state } = useStore()
  const P = PROGRAM_WRAPPED
  const ri = { ...P.returnIntent }
  if (state.returnIntent) ri[state.returnIntent] += 1
  const total = ri.yes + ri.maybe + ri.no
  const pct = (n) => Math.round((n / total) * 100)
  const Bars = ({ items, color }) => items.map(([label, v, w]) => (
    <div key={label} className="mt-2.5">
      <div className="flex justify-between text-xs"><span className="text-slate-600">{label}</span><b>{v}</b></div>
      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${w}%`, background: color }} /></div>
    </div>
  ))
  return (
    <Section title={<span className="flex items-center gap-2"><Gift size={20} style={{ color: 'var(--pink)' }} /> End-of-term report</span>} sub={`Built from the anonymous totals of ${total} people’s private Wrapped recaps. No individual recap is ever visible here.`}>
      <div className="kpis">
        <div className="card kpi k4">
          <div className="eyebrow">Would come back</div>
          <div className="v">{pct(ri.yes)}%</div>
          <div className="mt-2 flex h-3 overflow-hidden rounded-md gap-0.5"><div style={{ width: `${pct(ri.yes)}%`, background: 'var(--mint)' }} /><div style={{ width: `${pct(ri.maybe)}%`, background: 'var(--peach)' }} /><div style={{ width: `${pct(ri.no)}%`, background: 'var(--axis)' }} /></div>
          <div className="d mt-1">{pct(ri.maybe)}% maybe · {pct(ri.no)}% not this time</div>
        </div>
        <div className="card kpi k2"><div className="eyebrow">What energized early talent</div><Bars items={P.energizers.map((e) => [e.label, `${e.pct}%`, e.pct * 2.5])} color="var(--pink)" /></div>
        <div className="card kpi k1"><div className="eyebrow">What predicts coming back</div><Bars items={P.returnByTheme.map((r) => [r.theme, `${r.yes}%`, r.yes])} color="var(--navy-2)" /><div className="d mt-2">A responsive mentor nearly doubles it.</div></div>
        <div className="card kpi k3"><div className="eyebrow">Term at a glance</div>
          <ul className="mt-2 space-y-1.5 pl-0 text-sm" style={{ listStyle: 'none' }}>
            <li>Top skills: <b>{P.skills.slice(0, 3).join(', ')}</b></li>
            <li>Avg people worked with: <b>{P.avgPeopleMentioned}</b></li>
            <li>Hardest week: <b>week {P.dipWeek}</b></li>
            <li>Changes shipped from Echo: <b>{state.actions.length}</b></li>
          </ul>
        </div>
      </div>
    </Section>
  )
}

/* ---------------- page ---------------- */

function AiFixes({ problems, selected, setSelected }) {
  const { state, dispatch } = useStore()
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState(null)
  const g = problems.find((x) => x.id === selected) || problems[0]
  const run = async () => {
    if (!g) return
    setBusy(true); setOut(null)
    const posts = state.posts.filter((p) => p.groupId === g.id)
    const fixes = (state.threads[g.id] || []).filter((m) => m.fix).sort((a, b) => b.fixVotes - a.fixVotes)
    const r = await suggestFixes({ group: g, posts, fixes })
    setBusy(false); setOut({ ...r, groupId: g.id })
  }
  const effortTone = { 'Quick win': 'st-done', Medium: 'st-prog', 'Bigger project': '' }
  return (
    <div className="card" id="ai-fixes" style={{ marginTop: 8 }}>
      <div className="row">
        <h2 className="flex items-center gap-2" style={{ margin: 0 }}><Sparkles size={20} style={{ color: 'var(--pink)' }} /> AI fix suggestions</h2>
        <span className="sub" style={{ marginLeft: 'auto' }}>{AI_ENABLED ? 'Powered by Claude' : 'Built-in playbook (add an API key to use Claude)'}</span>
      </div>
      <p className="sub">Reads every post in the issue and the fixes early talent suggested in its Circle, then drafts a plan you can greenlight.</p>
      <div className="row" style={{ marginTop: 12 }}>
        <select className="sel" value={g?.id || ''} onChange={(e) => { setSelected(e.target.value); setOut(null) }}>
          {problems.map((x) => <option key={x.id} value={x.id}>{x.title} ({x.people.length})</option>)}
        </select>
        <button className="btn pink small" onClick={run} disabled={busy || !g}>{busy ? <><Loader2 size={14} className="animate-spin" /> Thinking…</> : <><Sparkles size={14} /> Suggest fixes</>}</button>
      </div>
      {out && out.groupId === g?.id && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>{out.summary}</p>
          <div className="eyebrow" style={{ marginTop: 14 }}>Likely root causes</div>
          <ul className="mt-1 space-y-1 pl-5" style={{ listStyle: 'disc' }}>{out.root_causes.map((c) => <li key={c} className="text-sm">{c}</li>)}</ul>
          <div className="eyebrow" style={{ marginTop: 14 }}>Recommended actions</div>
          <ul className="list">{out.actions.map((a) => (
            <li key={a.title} style={{ alignItems: 'flex-start' }}>
              <span style={{ flex: 1 }}><b>{a.title}</b><br /><span className="sub">{a.detail}</span><br /><span className="text-xs text-slate-500">Owner: {a.owner} · Impact: {a.impact}</span></span>
              <span className={`status ${effortTone[a.effort] || ''}`} style={!effortTone[a.effort] ? { background: 'var(--peach-soft)', color: 'var(--peach)' } : {}}>{a.effort}</span>
            </li>
          ))}</ul>
          <div className="prompt g" style={{ marginTop: 12 }}><b>How to know it worked:</b> {out.measure}</div>
          <div className="prompt b"><b>Draft “You said, we did”:</b> {out.response_draft}
            <div style={{ marginTop: 10 }}><button className="btn small" onClick={() => { dispatch({ type: 'STAFF_RESPOND', groupId: g.id, text: out.response_draft }); toast('Posted to “You said, we did”') }}>Post this response</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestedFixes() {
  const { state } = useStore()
  const rows = Object.entries(state.threads)
    .map(([gid, msgs]) => ({ g: state.groups.find((x) => x.id === gid), fixes: msgs.filter((m) => m.fix).sort((a, b) => b.fixVotes - a.fixVotes) }))
    .filter((r) => r.g && r.fixes.length)
  return (
    <Section title="How early talent would fix it" sub="Fixes suggested and upvoted inside Circles. Start here before designing your own.">
      {rows.length === 0 ? <div className="card sub">No fixes suggested yet.</div> : rows.map(({ g, fixes }) => (
        <div key={g.id} className="card">
          <div className="row"><ThemePill theme={g.theme} style={{ margin: 0 }} /><h3 style={{ margin: 0 }}>{g.title}</h3><span className="sub" style={{ marginLeft: 'auto' }}>{g.people.length} people</span></div>
          <ul className="list" style={{ marginTop: 8 }}>{fixes.map((f) => <li key={f.id}><span className="num">{f.fixVotes}</span><span style={{ flex: 1 }}>{f.text}</span><span className="sub">votes</span></li>)}</ul>
        </div>
      ))}
    </Section>
  )
}

export default function Dashboard() {
  const { state, dispatch } = useStore()
  const [circle, setCircle] = useState(null)
  const [tab, setTab] = useState('overview')
  const [f, setF] = useState({ role: '', lob: '', province: '', office: '' })
  const [rows, setRows] = useState('lob')
  const [aiFor, setAiFor] = useState('')
  if (circle) return <div className="wide"><Circle groupId={circle} staff onBack={() => setCircle(null)} /></div>
  const set = (x) => setF((o) => ({ ...o, ...x }))

  const audience = audienceSize({ team: f.lob, province: f.province, office: f.office })
  const tooSmall = audience < K_ANON
  const inLoc = (g) => (!f.province && !f.office) || Object.keys(g.offices || {}).some((o) => matchesLocation(o, f.province, f.office))
  const groups = tooSmall ? [] : [...state.groups].filter((g) => (!f.lob || g.teams[f.lob]) && inLoc(g)).sort((a, b) => b.people.length - a.people.length)
  const problems = groups.filter((g) => g.sentiment <= 0)
  const responded = new Set(state.actions.map((a) => a.groupId))
  const openIssues = problems.filter((g) => g.people.length >= CIRCLE_THRESHOLD && !responded.has(g.id))
  const rising = problems.filter((g) => g.people.length >= 5).sort((a, b) => b.growth - a.growth)[0]
  const atRisk = riskByWeek.at(-1).atRisk
  const posts = tooSmall ? [] : state.posts.filter((p) => (!f.role || (p.role || 'Co-op') === f.role) && (!f.lob || p.team === f.lob) && matchesLocation(p.office, f.province, f.office))
  const escalated = [...posts].filter((p) => p.echoes >= ESCALATE).sort((a, b) => b.echoes - a.echoes)
  const themeOf = (p) => state.groups.find((g) => g.id === p.groupId)?.theme
  const heatRows = rows === 'office' ? bigOffices().filter((o) => matchesLocation(o.name, f.province, f.office)).map((o) => o.name) : (f.lob ? [f.lob] : Object.keys(LOBSHORT))
  const waitingFollowUps = posts.filter((p) => p.followUp && !p.reply).length
  const toRespond = waitingFollowUps + escalated.filter((p) => !p.reply && themeOf(p) !== 'Wins').length + state.sensitive.filter((c) => !c.unsealed).length
  const respondPost = (p) => {
    const text = CANNED[themeOf(p)] || "We're running a career paths panel with AI Group alumni on Dec 3."
    dispatch({ type: 'RESPOND_POST', postId: p.id, text })
    toast('Response posted to “You said, we did”')
  }

  return (
    <section className="wide dash">
      <div className="pagehead"><div><h1>Early Talent dashboard</h1><p>Co-ops and new grads · all data is anonymous · only groups of {K_ANON} or more are shown</p></div></div>
      <Filters f={f} set={set} />
      <div className="tabs">
        <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button className={tab === 'respond' ? 'on' : ''} onClick={() => setTab('respond')}>Respond{toRespond ? ` (${toRespond})` : ''}</button>
        <button className={tab === 'fix' ? 'on' : ''} onClick={() => setTab('fix')}>What to fix{openIssues.length ? ` (${openIssues.length})` : ''}</button>
      </div>

      {tooSmall ? (
        <div className="card empty"><EyeOff size={40} className="mx-auto text-slate-500" /><h2>Hidden to protect anonymity</h2><p className="sub">Only {audience} {audience === 1 ? 'person matches' : 'people match'} these filters (minimum {K_ANON}).</p></div>
      ) : tab === 'overview' ? (
        <>
          <div className="kpis">
            <div className="card kpi k1"><span className="ic"><Heart size={22} /></span><div className="eyebrow">Early talent pulse</div><div className="v">68</div><div className="d"><span className="up-bad">▼ 4</span> vs last week · overall wellbeing, 0–100</div></div>
            <div className="card kpi k2"><span className="ic"><LifeBuoy size={22} /></span><div className="eyebrow">Leaving signals</div><div className="v">{atRisk} <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)' }}>of {COHORT_SIZE}</span></div><div className="d"><span className="up-bad">▲ 3</span> this week · {Math.round((atRisk / COHORT_SIZE) * 100)}%</div></div>
            <div className="card kpi k3"><span className="ic"><Handshake size={22} /></span><div className="eyebrow">Participation</div><div className="v">72%</div><div className="d">our trust score</div></div>
            <div className="card kpi k4"><span className="ic"><Inbox size={22} /></span><div className="eyebrow">Waiting on you</div><div className="v">{toRespond}</div><div className="d">to respond · avg response time 2.1 days</div></div>
          </div>
          {rising && <div className="prompt" style={{ marginBottom: 18 }}><b>Rising:</b> “{rising.title}” is up {Math.round(rising.growth * 100)}% in the last 2 weeks ({rising.people.length} people). <button className="link" onClick={() => setTab('fix')}>See what to fix →</button></div>}
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="row"><h2>Where to act</h2>
                <div className="seg" style={{ marginLeft: 'auto' }}><button className={rows === 'lob' ? 'on' : ''} onClick={() => setRows('lob')}>By LOB</button><button className={rows === 'office' ? 'on' : ''} onClick={() => setRows('office')}>By office</button></div>
              </div>
              <p className="sub">People raising or echoing problems. Hover a cell for details. Cells under {K_ANON} are hidden.</p>
              <Heatmap groups={groups} rows={heatRows} byOffice={rows === 'office'} />
              <div className="legend-ramp">Fewer <i style={{ background: 'var(--seq-1)' }} /><i style={{ background: 'var(--seq-3)' }} /><i style={{ background: 'var(--seq-5)' }} /><i style={{ background: 'var(--seq-7)' }} /> More</div>
            </div>
            <div className="card">
              <h2>Early talent showing leaving signals, by week</h2>
              <p className="sub">Counts only. Pink bands are the danger zones: midterms and return-offer season.</p>
              <RiskChart />
              <p className="sub" style={{ margin: '8px 0 0' }}>Top drivers: {riskDrivers.slice(0, 3).map((d, i) => <span key={d.signal}>{i ? ' · ' : ''}<b>{d.signal.split(' (')[0].toLowerCase()}</b> {d.pct}%</span>)}</p>
            </div>
          </div>
          <Section title="Who needs help" sub="Anonymous counts only. The AI privately nudges each person; RBC never learns who they are unless they choose to reveal.">
            <div className="grid gap-[18px] md:grid-cols-3">
              <div className="card" style={{ margin: 0 }}>
                <h3>Leaving signals by line of business</h3>
                <div className="h-48"><ResponsiveContainer><BarChart data={riskByTeam.map((r) => ({ ...r, team: LOBSHORT[r.team] || r.team }))} margin={{ top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--grid)" /><XAxis dataKey="team" tick={axis} interval={0} axisLine={false} tickLine={false} />
                  <YAxis tick={axis} allowDecimals={false} width={24} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'var(--blue-mist)' }} />
                  <Bar isAnimationActive={false} dataKey="count" name="People" fill={BRAND} radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart></ResponsiveContainer></div>
              </div>
              <div className="card" style={{ margin: 0 }}>
                <h3>What’s driving the risk</h3>
                {riskDrivers.map((d) => (
                  <div key={d.signal} className="mt-3">
                    <div className="flex justify-between text-xs"><span className="text-slate-600">{d.signal}</span><b>{d.pct}%</b></div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${d.pct}%`, background: 'var(--pink)' }} /></div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ margin: 0 }}>
                <h3>Is private help reaching people?</h3>
                {nudgeFunnel.map((st) => (
                  <div key={st.step} className="mt-2.5">
                    <div className="flex justify-between text-xs"><span className="text-slate-600">{st.step}</span><b>{st.n}</b></div>
                    <div className="mt-1 h-5 rounded-lg bg-slate-100"><div className="h-5 rounded-lg" style={{ width: `${(st.n / nudgeFunnel[0].n) * 100}%`, background: 'var(--navy-2)' }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
          <EndOfTermReport />
        </>
      ) : tab === 'respond' ? (
        <>
          <FollowUps f={f} />
          <Section title="Escalated posts" sub={`Posts with ${ESCALATE}+ echoes are sent to you automatically. Respond to close the loop.`}>
            <div className="card">
              <ul className="list">
                {escalated.map((p) => {
                  const a = p.reply ? <span className={`status ${p.status === 'prog' ? 'st-prog' : 'st-done'}`}>{p.status === 'prog' ? 'In progress' : '✓ Done'}</span>
                    : themeOf(p) === 'Wins' ? <span className="status st-done">Keep doing</span>
                    : <button className="btn small pink" onClick={() => respondPost(p)}>Respond</button>
                  return <li key={p.id}><span className="num">{p.echoes}</span><span style={{ flex: 1 }}><ThemePill theme={themeOf(p)} style={{ margin: '0 6px 0 0' }} />{p.text}</span>{a}</li>
                })}
                {!escalated.length && <li className="sub">Nothing escalated for these filters.</li>}
              </ul>
            </div>
          </Section>
          <Section title="Sensitive cases" sub="Posted anonymously. The poster’s identity is sealed and can only be unsealed, with a logged reason, for a formal investigation.">
            <div className="grid2">{state.sensitive.map((c) => <SensitiveCase key={c.id} c={c} />)}</div>
          </Section>
        </>
      ) : (
        <>
          <AiFixes problems={problems} selected={aiFor} setSelected={setAiFor} />
          <Section title="What to fix" sub="Similar posts are grouped automatically, so one group = one underlying problem. Biggest and fastest-growing first.">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500" style={{ background: 'var(--cream)' }}>
                  <tr><th className="px-5 py-3">Issue</th><th className="px-2 py-3 text-right">People</th><th className="px-2 py-3 text-right">2-wk change</th><th className="px-5 py-3">Action</th></tr>
                </thead>
                <tbody>
                  {problems.map((g) => (
                    <tr key={g.id} className="border-t border-slate-200 align-top">
                      <td className="px-5 py-3"><div className="font-bold">{g.title} {g.isNew && <Badge tone="blue">new</Badge>}</div><div className="mt-1 flex flex-wrap items-center gap-2"><ThemePill theme={g.theme} style={{ margin: 0 }} /><span className="text-xs text-slate-500">{Object.keys(g.teams).length} LOBs</span></div></td>
                      <td className="px-2 py-3 text-right font-extrabold tabular-nums">{g.people.length < K_ANON ? '<5' : g.people.length}</td>
                      <td className={`px-2 py-3 text-right font-bold tabular-nums ${g.growth > 0 ? 'up-bad' : 'up-good'}`}>{g.growth > 0 ? '+' : ''}{Math.round(g.growth * 100)}%</td>
                      <td className="px-5 py-3"><div className="flex flex-wrap items-center gap-2">
                        {responded.has(g.id) ? <span className="status st-done">Responded</span> : g.people.length >= CIRCLE_THRESHOLD ? <Respond group={g} /> : <span className="text-xs text-slate-500">Watching</span>}
                        <button className="link" onClick={() => { setAiFor(g.id); document.getElementById('ai-fixes')?.scrollIntoView({ behavior: 'smooth' }) }}><Sparkles size={13} className="inline" /> AI suggest</button>
                        {(state.threads[g.id] || []).length > 0 && <button className="link" onClick={() => setCircle(g.id)}><MessageCircle size={13} className="inline" /> Read Circle ({state.threads[g.id].length})</button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <SuggestedFixes />
          <div className="grid2">
            <Section title="Did it work?" sub="Week 1 buddy system: onboarding posts per week, 3 weeks before vs. after launch.">
              <div className="card">
                <div className="ba">
                  <div className="b"><div className="bv">22</div><div className="bar" style={{ height: '76%', background: 'var(--pink-2)' }} /></div>
                  <div className="b"><div className="bv">12</div><div className="bar" style={{ height: '42%', background: 'var(--navy-2)' }} /></div>
                </div>
                <div className="ba-l"><span>Before</span><span>After</span></div>
                <p className="sub" style={{ margin: '12px 0 0' }}><span className="up-good">▼ 45%</span> fewer onboarding posts · leaving signals tied to onboarding also fell</p>
              </div>
            </Section>
            <Section title="Changes in progress" sub="Every “You said, we did” action and what happened afterwards.">
              {state.actions.map((a) => {
                const g = state.groups.find((x) => x.id === a.groupId)
                return (
                  <div key={a.id} className="card ysd">
                    <div className="t">{a.status === 'done' ? '✓ Done' : 'In progress'} · {g?.title} · {a.echoes} people</div>
                    <p>{a.response}</p>
                    <p className="up-good" style={{ fontSize: 12.5 }}>{a.impact}</p>
                  </div>
                )
              })}
            </Section>
          </div>
        </>
      )}
    </section>
  )
}
