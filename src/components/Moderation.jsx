import { AlertTriangle, HeartHandshake, Lock, ShieldCheck, Ban, Sparkles } from 'lucide-react'
import { Button, Highlighted } from './ui'
import { ShieldList } from './Shield'

// What the poster sees after the AI checks their message, before anything is published.
export default function ModerationResult({ result, onConfirm, onEdit, onClose, onUseRewrite }) {
  const { action, reason, cleaned_text, redactions, generalized = [], styleChanges = [], sensitive_category, source, checks, tips = [], suggested_rewrite: rewrite = '' } = result
  const hidden = [...(redactions || []), ...generalized]
  const via = <p className="mt-2 text-[11px] text-slate-400">Checked by {source === 'claude' ? 'Claude' : 'Echo’s offline rules'}</p>

  if (action === 'crisis') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="flex items-center gap-2 font-semibold text-rose-800"><HeartHandshake size={18} /> You don’t have to carry this alone</div>
        <p className="mt-1 text-sm text-rose-900">{reason || 'It sounds like things are really hard right now.'} We didn’t post this.</p>
        <ul className="mt-3 space-y-1 text-sm text-rose-900">
          <li>• <b>Call or text 9-8-8</b>, the Suicide Crisis Helpline, any time, free</li>
          <li>• <b>Employee &amp; Family Assistance Program</b>: confidential counselling, 24/7</li>
          <li>• <b>Talk to a coordinator now</b>: you choose whether to share your name</li>
        </ul>
        <div className="mt-3 flex gap-2"><Button onClick={onClose}>Talk to a coordinator</Button><Button variant="ghost" onClick={onClose}>Close</Button></div>
        {via}
      </div>
    )
  }

  if (action === 'block') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 font-semibold text-amber-900"><Ban size={18} /> Echo Shield stopped this post</div>
        <p className="mt-1 text-sm text-amber-900">{reason}</p>
        <p className="mt-1 text-xs font-medium text-amber-800">On Echo you post about a situation, never a person or a named team.</p>
        {rewrite ? (
          <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700"><Sparkles size={13} /> Suggested version, about your experience</div>
            <p className="mt-1.5 text-[15px] text-slate-800"><Highlighted text={rewrite} /></p>
            {rewrite.includes('[what') && <p className="mt-1 text-xs text-slate-500">Fill in the highlighted part. Specific details are what get things fixed.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => onUseRewrite?.(rewrite)}>{rewrite.includes('[what') ? 'Use and fill in' : 'Use this version'}</Button>
              <Button variant="outline" onClick={onEdit}>Rewrite it myself</Button>
            </div>
          </div>
        ) : <div className="mt-3"><Button variant="outline" onClick={onEdit}>Edit message</Button></div>}
        {tips.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">Tips for writing it yourself</summary>
            <ul className="mt-1 space-y-1 text-slate-700">{tips.map((t) => <li key={t}>• {t}</li>)}</ul>
          </details>
        )}
        {via}
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-4 ${action === 'sensitive' ? 'border-violet-200 bg-violet-50' : 'border-emerald-200 bg-emerald-50'}`}>
      {action === 'sensitive' ? (
        <>
          <div className="flex items-center gap-2 font-semibold text-violet-900"><Lock size={18} /> Posted anonymously, with your identity sealed</div>
          <p className="mt-1 text-sm text-violet-900">
            This describes possible <b>{sensitive_category?.toLowerCase() || 'harassment'}</b>. Other early talent and the program team will only see it anonymously.
            Because RBC has to be able to investigate reports like this, your identity is <b>sealed and stored securely</b>. Only a trained investigator can unseal it, they have to give a reason, and every unseal is logged.
          </p>
          <p className="mt-2 text-sm text-violet-900">Prefer to go straight to a person? You can also report confidentially through the ethics hotline.</p>
        </>
      ) : (
        <div className="flex items-center gap-2 font-semibold text-emerald-900"><ShieldCheck size={18} /> {hidden.length || styleChanges.length ? 'Echo Shield made this anonymous' : 'Echo Shield: all clear'}</div>
      )}
      <div className="mt-3 rounded-md bg-white p-3 text-sm leading-relaxed text-slate-800"><Highlighted text={cleaned_text} /></div>
      {hidden.length > 0 && (
        <p className="mt-2 flex items-start gap-1 text-xs text-slate-600"><AlertTriangle size={14} className="mt-px shrink-0" />
          Changed: {hidden.map((r) => `“${r.original}” → ${r.replacement}`).join(', ')}
        </p>
      )}
      {checks && <div className="mt-3 rounded-md bg-white/70 p-3"><ShieldList checks={checks} /></div>}
      <div className="mt-3 flex gap-2">
        <Button onClick={onConfirm}>{action === 'sensitive' ? 'Post anonymously' : 'Post'}</Button>
        <Button variant="ghost" onClick={onEdit}>Edit</Button>
      </div>
      {via}
    </div>
  )
}
