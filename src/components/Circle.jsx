import { useState } from 'react'
import { ArrowLeft, Eye, Lightbulb, Loader2, ThumbsUp } from 'lucide-react'
import { useStore } from '../store'
import { moderate } from '../ai/moderate'
import { Badge, blurTime, Button, Card, Highlighted, THEME_TONE } from './ui'
import { ShieldLive } from './Shield'
import ModerationResult from './Moderation'

export default function Circle({ groupId, onBack, staff = false }) {
  const { state, dispatch } = useStore()
  const g = state.groups.find((x) => x.id === groupId)
  const msgs = state.threads[groupId] || []
  const fixes = msgs.filter((m) => m.fix).sort((a, b) => b.fixVotes - a.fixVotes)
  const [text, setText] = useState('')
  const [isFix, setIsFix] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const send = async (t = text) => {
    if (staff) { // staff replies are signed, not anonymous
      dispatch({ type: 'THREAD_MSG', groupId, text, staff: true }); setText(''); return
    }
    setBusy(true)
    const r = await moderate(t, state.groups)
    setBusy(false)
    dispatch({ type: 'SHIELD_LOG', result: r })
    if (r.action === 'allow') return post(r)
    if (r.action === 'block' || r.action === 'crisis') dispatch({ type: 'HOLD', item: { kind: r.action, reason: r.reason, where: 'Circle' } })
    setResult(r)
  }
  const post = (r) => {
    dispatch({ type: 'THREAD_MSG', groupId, text: r.cleaned_text, fix: isFix, sensitive: r.action === 'sensitive' ? (r.sensitive_category || 'Harassment') : null })
    setText(''); setIsFix(false); setResult(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={15} /> Back</button>
      <Card className="p-5">
        <Badge tone={THEME_TONE[g.theme]}>{g.theme} Circle</Badge>
        <h1 className="mt-1 text-2xl font-semibold">{g.title}</h1>
        <p className="text-sm text-slate-600">{g.people.length} people across {Object.keys(g.teams).length} teams feel this. {staff ? 'You are viewing as the Early Talent team.' : <>You’re <b>“{state.myAliases[groupId]}”</b> here, an alias used only in this Circle.</>}</p>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          <Eye size={15} className="mt-px shrink-0" />
          The Early Talent team can read this Circle so they can act on it. Names are never shown, and every message is checked by AI to remove identifying details first.
        </div>
      </Card>

      {fixes.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="flex items-center gap-1 font-semibold"><Lightbulb size={16} className="text-amber-500" /> Fixes suggested by early talent</div>
          <div className="mt-2 space-y-2">
            {fixes.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-2 text-sm">
                <span>{f.text}</span>
                <Button variant="outline" className="shrink-0 bg-white py-1 text-xs" disabled={staff || f.voted} onClick={() => dispatch({ type: 'VOTE_FIX', groupId, msgId: f.id })}><ThumbsUp size={13} /> {f.fixVotes}</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.mine && !staff ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] ${m.staff ? 'border border-brand/30 bg-blue-50' : m.mine && !staff ? 'bg-brand text-white' : 'border border-slate-200 bg-white'}`}>
              <div className={`mb-0.5 flex items-center gap-2 text-xs ${m.mine && !staff ? 'text-blue-100' : 'text-slate-500'}`}>
                <b>{m.alias}</b>{m.staff && <Badge tone="blue">Staff</Badge>}{m.fix && <Badge tone="amber">Suggested fix</Badge>}<span>{blurTime(m.at)}</span>
              </div>
              <Highlighted text={m.text} />
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-4 p-3">
        {result ? (
          <ModerationResult result={result} onConfirm={() => post(result)} onEdit={() => setResult(null)} onClose={() => { setResult(null); setText('') }}
            onUseRewrite={(t) => { setText(t); setResult(null); if (!t.includes('[what')) send(t) }} />
        ) : (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={staff ? 'Reply as the Early Talent team…' : 'Share your experience or suggest a fix…'} className="w-full resize-none rounded-lg border border-slate-300 p-2 text-[15px] outline-none focus:border-brand" />
            {!staff && <ShieldLive text={text} />}
            <div className="mt-2 flex items-center justify-between">
              {!staff ? (
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={isFix} onChange={(e) => setIsFix(e.target.checked)} /> This is a suggested fix</label>
              ) : <span className="text-xs text-slate-500">Posting as Early Talent team (signed)</span>}
              <Button onClick={() => send()} disabled={busy || text.trim().length < 2}>{busy ? <><Loader2 size={15} className="animate-spin" /> Checking…</> : 'Send'}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
