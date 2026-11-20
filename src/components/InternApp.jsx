import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Sparkles, X, MessageCircle, EyeOff, MapPin, ShieldCheck, Link2, Flame, CheckCircle2, BookOpen, Briefcase, AudioLines, MessagesSquare, Gift, Mic, Square, UserRound, Heart, Search, Inbox, Sprout, ArrowUpRight, Lock, Users } from 'lucide-react'
import { useStore } from '../store'
import { CIRCLE_THRESHOLD, ESCALATE, K_ANON, LOBS, LOBSHORT, ME, PROVINCES, RISK_SIGNAL_LABELS, THEMES } from '../data/seed'
import { moderate } from '../ai/moderate'
import { scoreGroups } from '../ai/rules'
import { audienceSize, bigOffices, bigProvinces, circleOpen, hotScore, matchesLocation, OTHER, safeLocation, THEME_COLOR, trendingPostIds } from '../lib'
import { Avatar, blurTime, Highlighted, ThemePill, toast } from './ui'
import { ShieldLive } from './Shield'
import ModerationResult from './Moderation'
import Filters from './Filters'
import Dictate from './Dictate'
import Circle from './Circle'
import WrappedPage from './WrappedPage'
import MyWork from './MyWork'

const NAV = [['work', BookOpen, 'Journal'], ['echo', AudioLines, 'Echo Feed'], ['circles', MessagesSquare, 'My Circles'], ['wrapped', Gift, 'Wrapped']]

export default function InternApp() {
  const [section, setSection] = useState('work')
  const [circle, setCircle] = useState(null)
  const go = (s) => { setSection(s); setCircle(null); window.scrollTo(0, 0) }
  return (
    <div className="shell">
      <aside className="side">
        <div className="me"><span className="av"><UserRound size={22} /></span><div><b>Anonymous</b><span>{ME.role} · Week 8 of 16</span></div></div>
        {NAV.map(([k, Icon, label]) => (
          <button key={k} className={`nb ${section === k ? 'on' : ''}`} onClick={() => go(k)}><span className="ic"><Icon size={19} /></span>{label}</button>
        ))}
        <div className="foot">Your tickets and notes are private. Echo posts are anonymous, always, and every post is checked by Echo Shield.</div>
      </aside>
      <main className="main">
        {circle ? <Circle groupId={circle} onBack={() => setCircle(null)} />
          : section === 'work' ? <MyWork onEcho={() => go('echo')} />
          : section === 'echo' ? <Feed onOpenCircle={setCircle} />
          : section === 'circles' ? <CirclesPage onOpenCircle={setCircle} />
          : <WrappedPage />}
      </main>
    </div>
  )
}

/* ================= FEED ================= */

function GroupChip({ group, count, onClick }) {
  return (
    <button onClick={onClick} className="gchip" title="Similar posts are grouped together">
      <Link2 size={12} />
      <span className="truncate">{group.title}</span>
      <span className="shrink-0 font-medium text-slate-500">· {count} posts · {group.people.length} people</span>
      {circleOpen(group) && <span className="flex shrink-0 items-center gap-0.5 text-brand"><MessageCircle size={12} /> Circle</span>}
    </button>
  )
}

function PostCard({ post, onMore, trending, hideGroup }) {
  const { state, dispatch } = useStore()
  const group = state.groups.find((g) => g.id === post.groupId)
  const echoed = state.myEchoes.includes(post.id)
  const mine = post.authorId === ME.id
  const inGroup = state.posts.filter((p) => p.groupId === post.groupId).length
  const escalated = post.echoes >= ESCALATE && !post.reply
  const echo = () => {
    if (mine) return toast('This is your post')
    dispatch({ type: 'ECHO', postId: post.id })
    if (echoed) return
    if (post.echoes + 1 === ESCALATE) toast(`↗ ${ESCALATE} people feel this way. Sent to the Early Talent team.`)
    else toast(`You and ${post.echoes} others feel this way`)
  }
  return (
    <div className="card post cat" style={{ '--cat': group ? THEME_COLOR[group.theme] : 'var(--border)' }}>
      <div className="ph">
        <Avatar id={post.id} />
        <span className="min-w-0">
          <span className="lobt">{post.team}</span><span className={`role ${post.role === 'New grad' ? 'ng' : ''}`}>{post.role || 'Co-op'}</span><br />
          <span className="inline-flex flex-wrap items-center gap-1">{blurTime(post.at)} · <MapPin size={11} />{safeLocation(post.team, post.office)}</span>
        </span>
        <span className="ml-auto flex flex-col items-end gap-1">
          {group && <ThemePill theme={group.theme} />}
          {trending && <span className="sent" style={{ marginTop: 0 }}><Flame size={12} /> Trending</span>}
        </span>
      </div>
      <p className="ptext"><Highlighted text={post.text} /></p>
      <div className="row" style={{ marginTop: 10 }}>
        {post.followUp ? <span className="status st-prog">Wants a follow-up</span> : <span className="status" style={{ background: 'var(--cream-2)', color: 'var(--ink-2)' }}>Just sharing</span>}
        {post.sensitive && <span className="status" style={{ background: 'var(--lav-soft)', color: '#7463c9' }}>Sensitive · identity sealed</span>}
        {mine && <span className="status st-done">You</span>}
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-700" title="Echo Shield: names and identifying details removed, writing style smoothed, time blurred, location only shown if 5+ people share it."><ShieldCheck size={13} /> Shield-checked</span>
      </div>
      {escalated && <span className="sent"><ArrowUpRight size={13} /> Sent to the Early Talent team</span>}
      {post.reply && <div className="reply"><b>Early Talent team:</b> {post.reply.text}</div>}
      <div className="pfoot flex-wrap">
        <button className={`echo ${echoed ? 'on' : ''}`} onClick={echo}><span className="ei">{echoed ? <Heart size={16} fill="currentColor" /> : 'ılıl'}</span>Echo · {post.echoes}</button>
        {group && !hideGroup && <GroupChip group={group} count={inGroup} onClick={() => onMore(post.groupId)} />}
      </div>
    </div>
  )
}

function GroupCard({ group, posts, onMore }) {
  const top = [...posts].sort((a, b) => b.echoes - a.echoes)
  return (
    <div className="card cat" style={{ padding: 0, overflow: 'hidden', '--cat': THEME_COLOR[group.theme] }}>
      <div style={{ padding: 20, background: 'var(--blue-mist)' }}>
        <div className="row"><ThemePill theme={group.theme} />{group.growth > 0.3 && <span className="status" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>Rising</span>}
          {circleOpen(group) && <span className="status st-prog" style={{ marginLeft: 'auto' }}>Circle open</span>}</div>
        <h3 style={{ fontSize: 19, marginTop: 8 }}>{group.title}</h3>
        <p className="sub"><b>{group.people.length}</b> people · {posts.length} posts · {Object.keys(group.teams).length} lines of business</p>
      </div>
      {top.slice(0, 2).map((p) => (
        <div key={p.id} className="flex items-start justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm">
          <p className="m-0"><Highlighted text={p.text} /></p>
          <span className="shrink-0 font-bold text-[var(--pink)]">ılıl {p.echoes}</span>
        </div>
      ))}
      <button onClick={() => onMore(group.id)} className="link block w-full border-t border-slate-200 py-3 text-center" style={{ textDecoration: 'none' }}>
        {posts.length > 2 ? `See all ${posts.length} posts →` : 'Open group →'}
      </button>
    </div>
  )
}

function GroupPanel({ groupId, onClose, onOpenCircle }) {
  const { state, dispatch } = useStore()
  const g = state.groups.find((x) => x.id === groupId)
  const posts = state.posts.filter((p) => p.groupId === groupId).sort((a, b) => b.echoes - a.echoes)
  const people = g.people.length
  const open = circleOpen(g)
  const joined = state.myCircles.includes(groupId)
  const action = state.actions.find((a) => a.groupId === groupId)
  return (
    <div className="drawer" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div><ThemePill theme={g.theme} /><h2 style={{ fontSize: 24, margin: '8px 0 2px' }}>{g.title}</h2>
            <p className="sub"><b>{people}</b> people across {Object.keys(g.teams).length} lines of business said or echoed this</p></div>
          <button className="link" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={20} /></button>
        </div>
        {action && <div className="card ysd" style={{ marginTop: 16 }}><div className="t">✓ You said, we did</div><p>{action.response}</p></div>}
        <div className="card" style={{ marginTop: 16 }}>
          {open ? (
            <>
              <h3>A Circle is open for this</h3>
              <p className="sub">Talk it through with others who feel the same. You get a new alias just for this Circle, so nobody can connect it to your other posts.</p>
              <button className="btn pink" style={{ marginTop: 12 }} onClick={() => { dispatch({ type: 'JOIN_CIRCLE', groupId }); onOpenCircle(groupId) }}>{joined ? 'Open Circle' : `Join ${people} others`}</button>
            </>
          ) : (
            <>
              <h3>Circle opens at {CIRCLE_THRESHOLD} people</h3>
              <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ background: 'var(--pink)', width: `${Math.min(100, (people / CIRCLE_THRESHOLD) * 100)}%` }} /></div>
              <p className="sub" style={{ marginTop: 6 }}>{Math.max(0, CIRCLE_THRESHOLD - people)} more needed, from at least 2 lines of business, so nobody can be identified.</p>
            </>
          )}
        </div>
        <div className="eyebrow" style={{ margin: '8px 0 10px' }}>{posts.length} posts grouped together</div>
        {posts.map((p) => <PostCard key={p.id} post={p} onMore={() => {}} hideGroup />)}
      </div>
    </div>
  )
}

const EXAMPLES = [
  ['Names', 'sarah on my team keeps giving me nothing to do'],
  ['Trash talk', 'My mentor is useless, she cancelled on me AGAIN'],
  ['Gives you away', "I'm the only co-op from uwaterloo in Halifax 😭 tbh it's sooo lonely!!!"],
  ['Constructive', 'Laptop and access took 2 weeks, so I spent my first sprint reading docs.'],
]

function Composer({ onPosted, onMore }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [debounced, setDebounced] = useState('')
  const [wasBlocked, setWasBlocked] = useState(false)

  useEffect(() => { const t = setTimeout(() => setDebounced(text), 350); return () => clearTimeout(t) }, [text])

  const similar = useMemo(() => {
    if (debounced.trim().length < 12) return []
    return scoreGroups(debounced, state.groups).slice(0, 2).map((s) => state.groups.find((g) => g.id === s.id))
  }, [debounced, state.groups])

  const check = async (t = text) => {
    setBusy(true)
    const r = await moderate(t, state.groups)
    setBusy(false); setResult(r)
    dispatch({ type: 'SHIELD_LOG', result: r, rewrite: wasBlocked && r.action !== 'block' })
    if (r.action === 'block') setWasBlocked(true)
    if (r.action === 'block' || r.action === 'crisis') dispatch({ type: 'HOLD', item: { kind: r.action, reason: r.reason, where: 'Post', blockKind: r.blockKind } })
  }

  const confirm = () => {
    dispatch({ type: 'ADD_POST', text: result.cleaned_text, theme: result.theme, groupId: result.group_id, newGroupTitle: result.action === 'sensitive' ? `${result.sensitive_category || 'Harassment'} reports` : result.new_group_title, followUp, sensitive: result.action === 'sensitive' ? (result.sensitive_category || 'Harassment') : null, signals: result.risk_signals, nudgeGroup: result.group_id || result.similar_group_ids?.[0] })
    toast(result.redactions?.length || result.generalized?.length ? 'Posted. Echo Shield removed details to keep you anonymous.' : 'Posted anonymously.')
    setText(''); setResult(null); setFollowUp(false); setWasBlocked(false); onPosted()
  }

  return (
    <div className="card">
      <div className="row"><h2 style={{ margin: 0, fontSize: 21 }}>What's on your mind?</h2><span className="sub" style={{ marginLeft: 'auto' }}>Posting as <b>Anonymous {ME.role.toLowerCase()} · {ME.team}</b></span></div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null) }} placeholder="A frustrating day, a mentor who ghosted you, a win… nobody will know it's you." style={{ minHeight: 84 }} />
      {!text && !result && (
        <div className="row" style={{ marginTop: 8 }}>
          <span className="flabel">Try Echo Shield</span>
          {EXAMPLES.map(([label, t]) => <button key={label} className="chip" onClick={() => setText(t)}>{label}</button>)}
        </div>
      )}
        
        {!result && <ShieldLive text={text} />}

        {similar.length > 0 && !result && (
          <div className="prompt b" style={{ marginTop: 10 }}>
            <div className="flex items-center gap-1 font-bold"><Sparkles size={15} /> Others have said something similar</div>
            {similar.map((g) => (
              <div key={g.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
                <span>“{g.title}” · <b>{g.people.length}</b> people</span>
                <button className="btn ghost small" onClick={() => onMore(g.id)}>See &amp; echo</button>
              </div>
            ))}
            <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>Echoing an existing post makes it count more. You can still post your own.</p>
          </div>
        )}

        {!result && (
          <>
            <div className="row" style={{ marginTop: 14 }}>
              <div className="seg">
                <button className={!followUp ? 'on' : ''} onClick={() => setFollowUp(false)}>Just sharing</button>
                <button className={followUp ? 'on' : ''} onClick={() => setFollowUp(true)}>I'd like a follow-up</button>
              </div>
            </div>
            <p className="sub" style={{ fontSize: 12, marginTop: 6 }}>{followUp ? 'The Early Talent team will reply under your post. You stay anonymous.' : 'Nobody will reach out. It still counts toward what the program fixes.'}</p>
            <div className="row" style={{ marginTop: 14 }}>
              <Dictate onText={(t) => { setText((d) => (d ? `${d} ${t}` : t)); setResult(null) }} />
              <button className="btn pink" style={{ marginLeft: 'auto' }} onClick={() => check()} disabled={busy || text.trim().length < 5}>
                {busy ? <><Loader2 size={15} className="animate-spin" /> Checking…</> : 'Post to Echo'}
              </button>
            </div>
          </>
        )}
        {result && <div style={{ marginTop: 14 }}><ModerationResult result={result} onConfirm={confirm} onEdit={() => setResult(null)} onClose={() => { setResult(null); setText('') }}
          onUseRewrite={(t) => { setText(t); setResult(null); if (!t.includes('[what')) check(t) }} /></div>}
    </div>
  )
}

function Nudge({ onOpen }) {
  const { state, dispatch } = useStore()
  if (!state.nudge) return null
  const g = state.groups.find((x) => x.id === state.nudge.groupId)
  return (
    <div className="card talk">
      <div className="row"><h2 style={{ fontSize: 19, margin: 0 }}>Just for you</h2><button className="link" style={{ marginLeft: 'auto', color: '#fff' }} onClick={() => dispatch({ type: 'DISMISS_NUDGE' })}><X size={16} /></button></div>
      <p className="sub" style={{ marginTop: 6 }}>It sounds like things have been tough lately. You're not alone: <b>{g?.people.length || 'others'}</b> people have felt something similar. Only you can see this.</p>
      <button className="btn block" onClick={() => onOpen(state.nudge.groupId)}>Chat with other early talent on Echo</button>
      <button className="btn ghost block" onClick={() => toast('Your coordinator will reach out within 1 business day. Only they see your name.')}>Talk to a coordinator (shares your name)</button>
      <p style={{ fontSize: 11, opacity: 0.8, marginTop: 10 }}>Why you're seeing this: {state.nudge.signals.map((s) => RISK_SIGNAL_LABELS[s]).join(', ')}</p>
    </div>
  )
}

function Feed({ onOpenCircle }) {
  const { state } = useStore()
  const [f, setF] = useState({ role: '', lob: '', province: '', office: '' })
  const set = (x) => setF((o) => ({ ...o, ...x }))
  const [tab, setTab] = useState('hot')
  const [chip, setChip] = useState('')
  const [layout, setLayout] = useState('posts')
  const [panel, setPanel] = useState(null)

  const audience = audienceSize({ team: f.lob, province: f.province, office: f.office })
  const tooSmall = audience < K_ANON
  const groupOf = (id) => state.groups.find((g) => g.id === id)
  const base = tooSmall ? [] : state.posts.filter((p) => (!f.role || (p.role || 'Co-op') === f.role) && (!f.lob || p.team === f.lob) && matchesLocation(p.office, f.province, f.office))
  const filtered = base.filter((p) => !chip || groupOf(p.groupId)?.theme === chip)
  const trendingIds = trendingPostIds(filtered)
  const sorter = { hot: (a, b) => hotScore(b) - hotScore(a), new: (a, b) => b.at - a.at, top: (a, b) => b.echoes - a.echoes }[tab] || (() => 0)
  const posts = [...filtered].sort(sorter)
  const groupsShown = state.groups
    .map((g) => ({ g, posts: filtered.filter((p) => p.groupId === g.id) }))
    .filter((x) => x.posts.length)
    .sort((a, b) => Math.max(...b.posts.map((p) => (tab === 'new' ? p.at : tab === 'top' ? p.echoes : hotScore(p)))) - Math.max(...a.posts.map((p) => (tab === 'new' ? p.at : tab === 'top' ? p.echoes : hotScore(p)))))
  const trendGroups = state.groups
    .map((g) => ({ g, n: base.filter((p) => p.groupId === g.id).reduce((s, p) => s + p.echoes, 0) }))
    .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 6)
  const ysd = [
    ...state.actions.map((a) => ({ id: a.id, text: a.response, groupId: a.groupId })),
    ...base.filter((p) => p.reply && Date.now() - p.at > 30 * 86400000).map((p) => ({ id: p.id, text: `${p.echoes} of you echoed this. ${p.reply.text}`, groupId: p.groupId })),
  ]

  return (
    <section>
      <div className="pagehead"><div><h1>Echo Feed</h1><p>What early talent across RBC is saying. Tap Echo if it's true for you too.</p></div><span className="pill" style={{ marginLeft: 'auto' }}><ShieldCheck size={14} /> Anonymous. Always.</span></div>
      <Filters f={f} set={set} />
      <div className="cols feed">
        <div className="min-w-0">
          <Composer onMore={setPanel} onPosted={() => setTab('new')} />
          <div className="tabs">
            {[['hot', 'Trending'], ['new', 'New'], ['top', 'Most echoed'], ['ysd', 'You said, we did']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {tab !== 'ysd' && (
            <div className="row" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
              <div className="chips" style={{ marginBottom: 0, flex: 1 }}>
                {['', ...THEMES].map((t) => <button key={t || 'all'} className={`chip ${chip === t ? 'on' : ''}`} onClick={() => setChip(t)}>{t && <span className="cdot" style={{ background: THEME_COLOR[t] }} />}{t || 'All'}</button>)}
              </div>
              <div className="seg"><button className={layout === 'posts' ? 'on' : ''} onClick={() => setLayout('posts')}>Posts</button><button className={layout === 'groups' ? 'on' : ''} onClick={() => setLayout('groups')}>Grouped</button></div>
            </div>
          )}

          {tooSmall ? (
            <div className="card empty"><EyeOff size={40} className="mx-auto text-slate-500" /><h2>Hidden to protect anonymity</h2><p className="sub">Only {audience} {audience === 1 ? 'person matches' : 'people match'} these filters, so showing their posts could identify them. Echo never shows a group smaller than {K_ANON}.</p></div>
          ) : tab === 'ysd' ? (
            ysd.length ? ysd.map((y) => <div key={y.id} className="card ysd"><div className="t"><CheckCircle2 size={14} /> You said, we did · {groupOf(y.groupId)?.title}</div><p>{y.text}</p></div>)
              : <div className="card empty"><Inbox size={40} className="mx-auto text-slate-500" /><p className="sub">No responses yet.</p></div>
          ) : filtered.length === 0 ? (
            <div className="card empty"><Search size={40} className="mx-auto text-slate-500" /><p className="sub">No posts match these filters.</p></div>
          ) : layout === 'posts' ? (
            posts.map((p) => <PostCard key={p.id} post={p} onMore={setPanel} trending={tab === 'hot' && trendingIds.has(p.id)} />)
          ) : (
            groupsShown.map(({ g, posts: ps }) => <GroupCard key={g.id} group={g} posts={ps} onMore={setPanel} />)
          )}
        </div>

        <div>
          <Nudge onOpen={setPanel} />
          <div className="card trend">
            <h3>Trending issues</h3><p className="sub">Echoes for the current filters. Similar posts are grouped.</p>
            <ul>{trendGroups.length ? trendGroups.map(({ g, n }) => (
              <li key={g.id} style={{ cursor: 'pointer' }} onClick={() => setPanel(g.id)}>
                <span className="min-w-0"><span className="block truncate font-semibold">{g.title}</span><ThemePill theme={g.theme} style={{ marginTop: 4, display: 'inline-block' }} /></span>
                <span className="n">{n}</span>
              </li>)) : <li className="sub">No echoes yet</li>}</ul>
          </div>
          <div className="card ysd">{ysd.length ? <><div className="t"><CheckCircle2 size={14} /> Latest: You said, we did</div><p>{ysd[0].text}</p></> : <><div className="t"><CheckCircle2 size={14} /> You said, we did</div><p className="sub">No responses for this filter yet.</p></>}</div>
          <div className="card">
            <h3 className="flex items-center gap-1.5"><ShieldCheck size={17} className="text-brand" /> Echo Shield protects you</h3>
            <ul className="mt-2 space-y-1.5 pl-0 text-[13px] leading-relaxed text-slate-600" style={{ listStyle: 'none' }}>
              <li><b>Names, emails, numbers</b> removed before anyone sees your post</li>
              <li><b>Details that point to you</b> (city, school, dates, “the only intern…”) generalized</li>
              <li><b>Writing style smoothed</b> so nobody recognizes how you type</li>
              <li><b>Times blurred</b> to “today” or “this week”</li>
              <li><b>Location</b> only shown when {K_ANON}+ people share it</li>
              <li><b>About a situation, never a person or named team.</b> Attacks and rumours are stopped, and Echo suggests a version about your experience</li>
            </ul>
          </div>
        </div>
      </div>

      {panel && <GroupPanel groupId={panel} onClose={() => setPanel(null)} onOpenCircle={(id) => { setPanel(null); onOpenCircle(id) }} />}
    </section>
  )
}

/* ================= CIRCLES ================= */

function CirclesPage({ onOpenCircle }) {
  const { state, dispatch } = useStore()
  const mine = state.myCircles.map((id) => state.groups.find((g) => g.id === id))
  const openOnes = state.groups.filter((g) => circleOpen(g) && !state.myCircles.includes(g.id) && g.theme !== 'Wins').sort((a, b) => b.people.length - a.people.length)
  return (
    <section>
      <div className="pagehead"><div><h1>My Circles</h1><p>Talk it through with other early talent who feel the same. A new alias in every Circle.</p></div><span className="pill" style={{ marginLeft: 'auto' }}>Early Talent team can read Circles</span></div>
      {mine.length === 0 && <div className="card empty"><Users size={40} className="mx-auto text-slate-500" /><h2>No Circles yet</h2><p className="sub">A Circle opens when {CIRCLE_THRESHOLD}+ interns from 2+ lines of business echo the same issue.</p></div>}
      {mine.map((g) => (
        <div key={g.id} className="card row">
          <div><ThemePill theme={g.theme} /><h3 style={{ marginTop: 6 }}>{g.title}</h3><p className="sub">You're “{state.myAliases[g.id]}” here · {(state.threads[g.id] || []).length} messages</p></div>
          <button className="btn small" style={{ marginLeft: 'auto' }} onClick={() => onOpenCircle(g.id)}>Open</button>
        </div>
      ))}
      {openOnes.length > 0 && <div className="eyebrow" style={{ margin: '20px 0 10px' }}>Open Circles you can join</div>}
      {openOnes.map((g) => (
        <div key={g.id} className="card row">
          <div><ThemePill theme={g.theme} /><h3 style={{ marginTop: 6 }}>{g.title}</h3><p className="sub">{g.people.length} people · {(state.threads[g.id] || []).length} messages</p></div>
          <button className="btn pink small" style={{ marginLeft: 'auto' }} onClick={() => { dispatch({ type: 'JOIN_CIRCLE', groupId: g.id }); onOpenCircle(g.id) }}>Join</button>
        </div>
      ))}
    </section>
  )
}
