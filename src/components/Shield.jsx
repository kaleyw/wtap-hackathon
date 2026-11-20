import { useEffect, useState } from 'react'
import { Check, ShieldCheck, Wand2, OctagonX } from 'lucide-react'
import { analyze, shieldChecks } from '../ai/rules'
import { Highlighted } from './ui'

const ICON = {
  ok: <Check size={13} className="text-emerald-600" />,
  fix: <Wand2 size={13} className="text-amber-600" />,
  stop: <OctagonX size={13} className="text-red-600" />,
}
const TEXT = { ok: 'text-slate-600', fix: 'text-amber-800', stop: 'text-red-700 font-medium' }

export function ShieldList({ checks, compact }) {
  return (
    <ul className={`grid gap-x-4 gap-y-1 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {checks.map((c) => (
        <li key={c.key} className="flex items-start gap-1.5 text-xs">
          <span className="mt-px">{ICON[c.status]}</span>
          <span><b className="font-medium text-slate-800">{c.label}:</b> <span className={TEXT[c.status]}>{c.detail}</span></span>
        </li>
      ))}
    </ul>
  )
}

// Live Echo Shield under the composer: shows exactly what others will see, updated as you type.
export function ShieldLive({ text }) {
  const [a, setA] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => setA(text.trim().length >= 8 ? analyze(text) : null), 250)
    return () => clearTimeout(t)
  }, [text])
  if (!a) return null
  const checks = shieldChecks(a)
  const stops = checks.filter((c) => c.status === 'stop').length
  const changes = [...a.redactions, ...a.generalized]
  const changed = changes.length > 0 || a.styleChanges.length > 0
  return (
    <div className={`mt-2 rounded-2xl border p-3 ${stops ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-bold"><ShieldCheck size={16} className="text-brand" /> Echo Shield · live</div>
        <span className="text-[11px] font-semibold text-slate-500">{stops ? 'Needs a rewrite before posting' : changed ? `${changes.length + (a.styleChanges.length ? 1 : 0)} change${changes.length + (a.styleChanges.length ? 1 : 0) > 1 ? 's' : ''} made for you` : 'All clear'}</span>
      </div>
      <div className="rounded-xl bg-white p-3">
        <div className="eyebrow" style={{ fontSize: 10 }}>{stops ? 'Won’t be posted as written' : 'What others will see'}</div>
        <p className={`mt-1 text-[15px] leading-relaxed ${stops ? 'text-slate-500 line-through decoration-red-500' : ''}`}><Highlighted text={a.cleaned} /></p>
        {changes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {changes.map((c, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"><s className="text-red-600">{c.original}</s> → <b>{c.replacement}</b></span>
            ))}
            {a.styleChanges.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">Writing style: {a.styleChanges.join(', ')}</span>}
          </div>
        )}
      </div>
      <div className="mt-2"><ShieldList checks={checks} /></div>
    </div>
  )
}
