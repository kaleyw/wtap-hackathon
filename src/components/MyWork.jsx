import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ChevronDown, Trash2, Briefcase, Check, Copy, FileText, GitBranch, GripVertical, LayoutGrid, Loader2, Lock, MessageSquareText, NotebookPen, Plug, RefreshCw, Sparkles, StickyNote, X } from 'lucide-react'
import { useStore } from '../store'
import { CURRENT_WEEK, NOTE_TAGS, WORK_SOURCES, WORK_TASKS } from '../data/seed'
import { generate } from '../ai/work'
import { readFeelings } from '../ai/feelings'
import { AI_ENABLED } from '../ai/moderate'
import { toast } from './ui'
import Dictate from './Dictate'
import { syncStatus, TRACKERS } from '../integrations/trackers'

const SOURCE_ICON = { jira: LayoutGrid, github: GitBranch, ado: Briefcase }
const COLUMNS = ['To do', 'In progress', 'Done']
const KEY = 'echo-work-v2'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }

// One private workspace: your tickets (Jira-style board) + your notes + a gentle read on how you're doing
export default function MyWork({ onEcho }) {
  const { state, dispatch } = useStore()
  const saved = load()
  const [connected, setConnected] = useState(saved?.connected || Object.fromEntries(WORK_SOURCES.map((s) => [s.id, s.connected])))
  const [syncing, setSyncing] = useState('')
  const [open, setOpen] = useState(null)
  const [justDone, setJustDone] = useState(false)

  const tasks = state.workTasks.filter((t) => connected[t.source])
  const notes = state.notes.filter((n) => !n.taskId || tasks.some((t) => t.id === n.taskId))
  const read = useMemo(() => readFeelings(notes, tasks, CURRENT_WEEK), [notes, tasks])

  const connect = (id) => {
    setSyncing(id)
    setTimeout(() => {
      const c = { ...connected, [id]: !connected[id] }
      setConnected(c); setSyncing('')
      try { localStorage.setItem(KEY, JSON.stringify({ connected: c })) } catch { /* ignore */ }
      toast(c[id] ? `${WORK_SOURCES.find((s) => s.id === id).name} connected. Tasks synced.` : 'Disconnected')
    }, connected[id] ? 200 : 1100)
  }

  // Move a ticket here, and push the same change to Jira / GitHub / Azure DevOps
  const move = async (id, status) => {
    const t = tasks.find((x) => x.id === id)
    if (!t || t.status === status) return
    dispatch({ type: 'MOVE_TASK', id, status })
    if (status === 'Done') { setOpen(id); setJustDone(true) }
    const r = await syncStatus(t, status)
    dispatch({ type: 'TASK_SYNCED', id, tool: r.tool, remote: r.remote, request: r.request })
    toast(`${id} moved to “${r.remote}” in ${r.tool}`)
  }

  return (
    <section>
      <div className="pagehead">
        <div><h1>Journal</h1><p>Your tickets and your private notes in one place. Week {CURRENT_WEEK} of 16.</p></div>
        <div className="row" style={{ marginLeft: 'auto' }}>
          <span className="pill"><Lock size={13} /> Private to you</span>
          <button className="btn pink small" onClick={() => document.getElementById('words')?.scrollIntoView({ behavior: 'smooth' })}><Sparkles size={14} /> Turn my work into words <ArrowDown size={14} /></button>
        </div>
      </div>

      <TodayNote dispatch={dispatch}>
        <NotesList notes={notes} tasks={tasks} onOpenTask={(id) => { setOpen(id); setJustDone(false) }} onRemove={(id) => { dispatch({ type: 'REMOVE_NOTE', id }); toast('Note deleted') }} />
      </TodayNote>

      <Board tasks={tasks} notes={notes} onOpen={(id) => { setOpen(id); setJustDone(false) }} onMove={move} />

      <div className="card">
        <div className="row"><h3 className="flex items-center gap-2" style={{ margin: 0 }}><Plug size={16} /> Connected tools</h3><span className="sub" style={{ marginLeft: 'auto', fontSize: 12 }}>Echo only reads tickets assigned to you. Demo uses sample tickets; production connects through each tool’s API with your RBC sign-in.</span></div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {WORK_SOURCES.map((s) => {
            const Icon = SOURCE_ICON[s.id]
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <span className="ins-ic" style={{ background: connected[s.id] ? 'var(--mint-soft)' : 'var(--cream-2)' }}><Icon size={19} /></span>
                <div className="min-w-0 flex-1"><b className="block text-sm">{s.name}</b><span className="block truncate text-xs text-slate-500">{connected[s.id] ? `${state.workTasks.filter((t) => t.source === s.id).length} tickets · ${s.detail} · two-way sync` : 'Not connected'}</span></div>
                <button className={`btn small ${connected[s.id] ? 'ghost' : ''}`} onClick={() => connect(s.id)} disabled={syncing === s.id}>
                  {syncing === s.id ? <Loader2 size={13} className="animate-spin" /> : connected[s.id] ? <><Check size={13} /> Connected</> : 'Connect'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <WordsPanel tasks={tasks} notes={notes} />

      <FeelingsCard read={read} onEcho={onEcho} onOpenTask={setOpen} />

      {open && <TaskDrawer task={tasks.find((t) => t.id === open)} notes={notes.filter((n) => n.taskId === open)} justDone={justDone} lastSync={state.syncLog.find((l) => l.taskId === open)} dispatch={dispatch} onMove={move} onClose={() => { setOpen(null); setJustDone(false) }} />}
    </section>
  )
}

/* ---------- quick note ---------- */
function TodayNote({ dispatch, taskId = null, compact, initialTags = [], placeholder, children }) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState(initialTags)
  const [dictated, setDictated] = useState(false)
  const save = () => {
    if (!text.trim() && !tags.length) return
    dispatch({ type: 'ADD_NOTE', taskId, text: text.trim() || tags.join(', '), tags, dictated })
    setText(''); setTags([]); setDictated(false)
    toast(tags.some((t) => ['Shipped', 'Got feedback'].includes(t)) ? 'Saved. Added to your review prep.' : 'Saved to your private notes.')
  }
  return (
    <div className={compact ? '' : 'card'}>
      {!compact && <><h2 className="flex items-center gap-2" style={{ margin: 0, fontSize: 20 }}><NotebookPen size={19} /> Quick note</h2><p className="sub">A few words is plenty. Tap a tag if that's all you have time for.</p></>}
      <div className="row" style={{ marginTop: 10 }}>
        {NOTE_TAGS.map((t) => <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder || (taskId ? 'Add a private note to this ticket…' : 'How did today go? Anything you shipped, learned, or got stuck on?')} style={{ minHeight: compact ? 70 : 84, marginTop: 10 }} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn small" onClick={save} disabled={!text.trim() && !tags.length}>Save note</button>
        <Dictate className="ml-auto" onText={(t) => { setText((d) => (d ? `${d} ${t}` : t)); setDictated(true) }} />
      </div>
      {children}
    </div>
  )
}

/* ---------- your notes: collapsed to one line until you open it ---------- */
function NotesList({ notes, tasks, onOpenTask, onRemove }) {
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const sorted = [...notes].sort((a, b) => b.week - a.week || (b.at || 0) - (a.at || 0))
  const shown = all ? sorted : sorted.slice(0, 5)
  const latest = sorted[0]
  const title = (id) => tasks.find((t) => t.id === id)?.title
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <b className="text-sm">My notes</b>
        <span className="status" style={{ padding: '1px 8px', fontSize: 11, background: 'var(--cream-2)', color: 'var(--ink-2)' }}>{notes.length}</span>
        {!open && latest && <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500">Latest: {latest.text}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-slate-500 transition" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="mt-2">
          <ul className="list">
            {shown.map((n) => (
              <li key={n.id} style={{ alignItems: 'flex-start' }}>
                <span className="mono shrink-0 pt-0.5 text-xs text-slate-500" style={{ minWidth: 34 }}>W{n.week}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="block text-[14px]">{n.text}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    {n.tags.map((t) => <span key={t} className="status st-prog" style={{ padding: '1px 8px', fontSize: 10.5 }}>{t}</span>)}
                    {n.taskId && <button className="link" style={{ fontSize: 12 }} onClick={() => onOpenTask(n.taskId)}>{n.taskId}: {title(n.taskId)}</button>}
                  </span>
                </span>
                <button className="link shrink-0" onClick={() => onRemove(n.id)} aria-label="Delete note" title="Delete note"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
          {sorted.length > 5 && <button className="link" style={{ fontSize: 13, marginTop: 6 }} onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${sorted.length}`}</button>}
        </div>
      )}
    </div>
  )
}

/* ---------- how you're doing ---------- */
function FeelingsCard({ read, onEcho, onOpenTask }) {
  const [asked, setAsked] = useState(false)
  const tone = { tough: 'var(--pink-mist)', mixed: 'var(--peach-soft)', good: 'var(--mint-soft)' }[read.level]
  const max = Math.max(1, ...read.weeks.map((w) => Math.abs(w.score)))
  return (
    <div className="card" style={{ background: tone }}>
      <div className="row"><h2 style={{ margin: 0, fontSize: 20 }}>How you're doing</h2><span className="sub" style={{ marginLeft: 'auto', fontSize: 12 }}><Lock size={11} className="inline" /> Only you see this</span></div>
      <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{read.headline}</p>

      <div className="mt-3 flex h-16 items-center gap-1.5" aria-label="Your weeks">
        {read.weeks.map((w) => (
          <div key={w.week} className="flex h-full flex-1 flex-col items-center justify-center" title={`Week ${w.week}`}>
            <div className="flex h-1/2 w-full items-end">{w.score > 0 && <span className="w-full rounded-t-md" style={{ height: `${(w.score / max) * 100}%`, background: 'var(--mint)' }} />}</div>
            <div className="flex h-1/2 w-full items-start">{w.score < 0 && <span className="w-full rounded-b-md" style={{ height: `${(-w.score / max) * 100}%`, background: 'var(--pink-2)' }} />}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 text-[10px] text-slate-500">{read.weeks.map((w) => <span key={w.week} className="flex-1 text-center">W{w.week}</span>)}</div>

      {read.reasons.length > 0 && (
        <>
          <div className="eyebrow" style={{ marginTop: 12 }}>Why we think so</div>
          <ul className="mt-1 space-y-1.5 pl-0" style={{ listStyle: 'none' }}>
            {read.reasons.map((r) => (
              <li key={r.key} className="flex items-start gap-2 text-[13.5px]">
                <span className="status" style={{ padding: '1px 8px', fontSize: 10.5, background: 'var(--surface)', color: 'var(--ink-2)' }}>{r.kind === 'work' ? 'Tickets' : 'Your notes'}</span>
                <span>{r.text} {r.taskId && <button className="link" style={{ fontSize: 12.5 }} onClick={() => onOpenTask(r.taskId)}>Open</button>}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {read.level !== 'good' && (
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn small" onClick={onEcho}>Chat with other early talent on Echo</button>
          <button className="btn ghost small" onClick={() => toast('Your coordinator will reach out within 1 business day. Only they see your name.')}>Talk to a coordinator</button>
          <button className="btn ghost small" onClick={() => setAsked(true)}>Bring it up with my manager</button>
        </div>
      )}
      {asked && (
        <div className="prompt b" style={{ background: 'var(--surface)' }}>
          <b>You could say:</b> “{read.managerAsk}”
          <div style={{ marginTop: 8 }}><button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(read.managerAsk).catch(() => {}); toast('Copied') }}><Copy size={13} /> Copy</button></div>
        </div>
      )}
      <p className="sub" style={{ marginTop: 12, fontSize: 11.5 }}>Based on your wording over the term and your ticket progress. It’s a nudge, not a diagnosis, and never shared with your manager. The Early Talent team only sees anonymous totals for groups of 5+.</p>
    </div>
  )
}

/* ---------- Jira-style board: drag cards between columns ---------- */
function Board({ tasks, notes, onOpen, onMove }) {
  const [over, setOver] = useState('')
  const [dragging, setDragging] = useState('')
  return (
    <>
      <p className="sub" style={{ margin: '18px 0 8px' }}>Drag a ticket to another column. The change is sent to Jira, GitHub Projects or Azure DevOps too.</p>
      <div className="mb-[18px] grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col)
          return (
            <div key={col}
              onDragOver={(e) => { e.preventDefault(); setOver(col) }}
              onDragLeave={() => setOver((o) => (o === col ? '' : o))}
              onDrop={(e) => { e.preventDefault(); setOver(''); setDragging(''); onMove(e.dataTransfer.getData('text/plain'), col) }}
              className="rounded-3xl p-3 transition"
              style={{ background: over === col ? 'var(--blue-soft)' : 'var(--cream-2)', outline: over === col ? '2px dashed var(--blue)' : 'none' }}>
              <div className="row px-1 pb-2"><b className="text-sm uppercase tracking-wide text-slate-600">{col}</b><span className="status" style={{ marginLeft: 'auto', background: 'var(--surface)', color: 'var(--ink-2)' }}>{items.length}</span></div>
              <div className="min-h-[60px] space-y-2.5">
                {items.map((t) => {
                  const Icon = SOURCE_ICON[t.source]
                  const n = notes.filter((x) => x.taskId === t.id).length
                  const stuck = t.status === 'In progress' && (t.days || 0) >= 10
                  return (
                    <div key={t.id} draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setDragging(t.id) }}
                      onDragEnd={() => { setDragging(''); setOver('') }}
                      onClick={() => onOpen(t.id)}
                      role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(t.id) }}
                      className="block w-full cursor-grab rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[var(--blue)] active:cursor-grabbing"
                      style={{ opacity: dragging === t.id ? 0.4 : 1 }}>
                      <div className="flex items-start gap-1.5"><GripVertical size={14} className="mt-0.5 shrink-0 text-slate-400" /><div className="text-[14px] font-semibold leading-snug">{t.title}</div></div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><Icon size={12} /> {t.id}</span>
                        <span>· {t.project}</span>
                        {t.kind === 'admin' && <span className="status" style={{ padding: '1px 8px', fontSize: 10.5, background: 'var(--cream-2)', color: 'var(--ink-2)' }}>Admin</span>}
                        {t.blocked && <span className="status" style={{ padding: '1px 8px', fontSize: 10.5, background: 'var(--pink-mist)', color: 'var(--critical)' }}>Blocked</span>}
                        {stuck && <span className="inline-flex items-center gap-0.5 font-bold text-[var(--critical)]"><AlertTriangle size={11} /> {t.days} days</span>}
                        {n > 0 && <span className="ml-auto inline-flex items-center gap-0.5"><StickyNote size={12} /> {n}</span>}
                      </div>
                      {t.sync && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: t.sync === 'pending' ? 'var(--navy)' : 'var(--good-text)' }}>
                          {t.sync === 'pending' ? <><RefreshCw size={11} className="animate-spin" /> Syncing to {TRACKERS[t.source].name}…</> : <><Check size={11} /> {TRACKERS[t.source].name}: {t.sync}</>}
                        </div>
                      )}
                    </div>
                  )
                })}
                {!items.length && <p className="sub px-1" style={{ fontSize: 12.5 }}>Drop a ticket here.</p>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function TaskDrawer({ task, notes, dispatch, onClose, onMove, justDone, lastSync }) {
  if (!task) return null
  const Icon = SOURCE_ICON[task.source]
  return (
    <div className="drawer" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div><span className="sub inline-flex items-center gap-1"><Icon size={13} /> {task.id} · {task.project}</span><h2 style={{ fontSize: 22, margin: '6px 0' }}>{task.title}</h2></div>
          <button className="link" style={{ marginLeft: 'auto' }} onClick={onClose}><X size={20} /></button>
        </div>
        <div className="row">
          <label className="sub" htmlFor="move-to">Status</label>
          <select id="move-to" className="sel" value={task.status} onChange={(e) => onMove(task.id, e.target.value)}>{COLUMNS.map((c) => <option key={c}>{c}</option>)}</select>
          {task.days ? <span className="sub">{task.days} days in this column</span> : null}
          {task.blocked && <span className="status" style={{ background: 'var(--pink-mist)', color: 'var(--critical)' }}>Blocked</span>}
          {task.skills.length > 0 && <span className="sub">{task.skills.join(' · ')}</span>}
        </div>
        {lastSync && <div className="mt-3 rounded-xl p-2.5 text-[11.5px]" style={{ background: 'var(--cream)', fontFamily: 'ui-monospace, monospace', color: 'var(--ink-2)' }}><b style={{ fontFamily: 'inherit' }}>Sent to {lastSync.tool}:</b> {lastSync.request}<div style={{ marginTop: 4 }}>Demo: simulated. Production sends this with your own sign-in.</div></div>}
        {task.impact && <div className="prompt g"><b>Impact:</b> {task.impact}</div>}
        {justDone && task.status === 'Done' && (
          <div className="card" style={{ marginTop: 14, background: 'var(--mint-soft)' }}>
            <h3 style={{ margin: 0 }}>Nice work. What did this unlock?</h3>
            <p className="sub">One line is enough. Jira knows you finished it; only you know why it mattered. This goes straight into your review prep.</p>
            <TodayNote dispatch={dispatch} taskId={task.id} compact initialTags={['Shipped']} placeholder="e.g. Unblocked the v3 launch, or the team now runs evals on real data every week" />
          </div>
        )}
        <div className="eyebrow" style={{ marginTop: 18 }}>Your private notes on this ticket</div>
        {notes.length === 0 && <p className="sub">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="card" style={{ padding: 14, marginTop: 10, marginBottom: 0 }}>
            <div className="row"><span className="sub" style={{ fontSize: 12 }}>Week {n.week}</span>{n.tags.map((t) => <span key={t} className="status st-prog" style={{ padding: '1px 8px', fontSize: 10.5 }}>{t}</span>)}</div>
            <p style={{ margin: '6px 0 0' }}>{n.text}</p>
          </div>
        ))}
        <div className="card" style={{ marginTop: 14 }}><TodayNote dispatch={dispatch} taskId={task.id} compact /></div>
      </div>
    </div>
  )
}

/* ---------- AI: manager summary + resume bullets ---------- */
function WordsPanel({ tasks, notes }) {
  const [picked, setPicked] = useState(new Set(tasks.filter((t) => t.status === 'Done' && t.kind === 'tech').map((t) => t.id)))
  const [mode, setMode] = useState('manager')
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState({})
  const chosen = tasks.filter((t) => picked.has(t.id))
  const run = async () => {
    setBusy(true)
    const input = mode === 'manager' ? [...chosen, ...tasks.filter((t) => t.status !== 'Done' && t.kind === 'tech' && !picked.has(t.id))] : chosen
    const r = await generate(mode, input, notes.filter((n) => !n.taskId || picked.has(n.taskId)))
    setBusy(false); setOut({ ...out, [mode]: r })
  }
  const copy = (text) => { navigator.clipboard?.writeText(text).catch(() => {}); toast('Copied') }
  const toggle = (id) => { const p = new Set(picked); p.has(id) ? p.delete(id) : p.add(id); setPicked(p); setOut({}) }
  const result = out[mode]
  return (
    <div className="card" id="words" style={{ scrollMarginTop: 90 }}>
      <div>
        <div className="row"><h2 className="flex items-center gap-2" style={{ margin: 0 }}><Sparkles size={20} style={{ color: 'var(--pink)' }} /> Turn my work into words</h2></div>
        <p className="sub">Uses your finished tickets and your notes (feedback you got, things Jira doesn’t know). {AI_ENABLED ? 'Powered by Claude.' : 'Built-in template; add an API key to use Claude.'}</p>
        <div className="seg" style={{ marginTop: 12, display: 'inline-flex' }}>
          <button className={mode === 'manager' ? 'on' : ''} onClick={() => setMode('manager')}><MessageSquareText size={13} className="inline" /> Talk to my manager</button>
          <button className={mode === 'resume' ? 'on' : ''} onClick={() => setMode('resume')}><FileText size={13} className="inline" /> Resume bullets</button>
        </div>
        <details style={{ marginTop: 10 }}>
          <summary className="sub" style={{ cursor: 'pointer' }}>{chosen.length} tickets selected</summary>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">{tasks.filter((t) => t.status === 'Done').map((t) => <label key={t.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={picked.has(t.id)} onChange={() => toggle(t.id)} />{t.title}</label>)}</div>
        </details>
        <button className="btn pink block" style={{ marginTop: 12 }} onClick={run} disabled={busy || !chosen.length}>{busy ? <><Loader2 size={15} className="animate-spin" /> Writing…</> : <><Sparkles size={15} /> {result ? 'Regenerate' : 'Generate'}</>}</button>

        {result && mode === 'manager' && (
          <div style={{ marginTop: 16 }}>
            <div className="prompt b" style={{ marginTop: 0 }}><b>Open with:</b> “{result.headline}”</div>
            <div className="eyebrow" style={{ marginTop: 14 }}>Talking points</div>
            <ul className="list">{result.talking_points.map((t) => <li key={t.point} style={{ alignItems: 'flex-start' }}><Check size={15} className="mt-1 shrink-0 text-emerald-700" /><span>{t.point}<br /><span className="text-xs text-slate-500">{t.evidence}</span></span></li>)}</ul>
            {result.feedback?.length > 0 && <div className="prompt"><b>Feedback you got (from your notes):</b>{result.feedback.map((f) => <div key={f}>“{f}”</div>)}</div>}
            <div className="prompt g"><b>Ask for your next step:</b> “{result.next_ask}”</div>
            <div className="eyebrow" style={{ marginTop: 14 }}>Why this works</div>
            <ul className="mt-1 space-y-1 pl-5 text-sm" style={{ listStyle: 'disc' }}>{result.coaching.map((c) => <li key={c}>{c}</li>)}</ul>
            <button className="btn ghost small" style={{ marginTop: 12 }} onClick={() => copy([result.headline, '', ...result.talking_points.map((t) => `• ${t.point}`), '', result.next_ask].join('\n'))}><Copy size={13} /> Copy</button>
          </div>
        )}
        {result && mode === 'resume' && (
          <div style={{ marginTop: 16 }}>
            <ul className="list">{result.bullets.map((b) => <li key={b} style={{ alignItems: 'flex-start' }}><span className="mt-0.5">•</span><span style={{ flex: 1 }}>{b}</span><button className="link" onClick={() => copy(b)} aria-label="Copy bullet"><Copy size={13} /></button></li>)}</ul>
            <p className="text-sm" style={{ marginTop: 10 }}><b>Skills:</b> {result.skills.join(' · ')}</p>
            <button className="btn ghost small" style={{ marginTop: 12 }} onClick={() => copy(result.bullets.map((b) => `• ${b}`).join('\n') + `\n\nSkills: ${result.skills.join(', ')}`)}><Copy size={13} /> Copy all</button>
          </div>
        )}
      </div>
    </div>
  )
}
