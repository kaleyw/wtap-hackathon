import { useEffect, useState } from 'react'
import { Pause, Play, UserRound } from 'lucide-react'
export const timeAgo = (t) => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const Card = ({ className = '', children, ...rest }) => (
  <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} {...rest}>{children}</div>
)

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-violet-50 text-violet-700',
}
export const Badge = ({ tone = 'slate', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>{children}</span>
)

export const THEME_TONE = { Mentorship: 'purple', Onboarding: 'blue', 'Team dynamics': 'amber', 'Career growth': 'green', Workload: 'red', Wins: 'green' }

// Buttons use the team's .btn styles
export const Button = ({ variant = 'primary', className = '', ...rest }) => {
  const v = { primary: 'btn small', ghost: 'link', outline: 'btn ghost small', danger: 'btn small pink' }[variant]
  return <button className={`${v} ${className}`} {...rest} />
}

// Shows cleaned text with redacted brackets highlighted
export const Highlighted = ({ text }) => (
  <>
    {text.split(/(\[[^\]]+\])/g).map((part, i) =>
      part.startsWith('[') ? <mark key={i} className="rounded bg-accent/60 px-1 text-slate-900">{part}</mark> : <span key={i}>{part}</span>
    )}
  </>
)

// Post times are blurred so nobody can match a post to who just left a meeting
export const blurTime = (t) => {
  const d = new Date(t), now = new Date()
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  if (days < 31) return 'This month'
  return 'Earlier'
}

// ---- Pieces from the team's mockup ----

// Their theme pills (class names come from echo-theme.css)
const TCLS = { Mentorship: 'ment', Wins: 'win', 'Career growth': 'car', 'Team dynamics': 'team', Workload: 'work' }
export const ThemePill = ({ theme, style }) => <span className={`theme ${TCLS[theme] || ''}`} style={style}>{theme === 'Wins' ? 'Win' : theme}</span>

// Toasts: call toast('message') from anywhere
export const toast = (msg) => window.dispatchEvent(new CustomEvent('echo-toast', { detail: msg }))
export function Toaster() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  useEffect(() => {
    let t
    const on = (e) => { setMsg(e.detail); setShow(true); clearTimeout(t); t = setTimeout(() => setShow(false), 3000) }
    window.addEventListener('echo-toast', on)
    return () => window.removeEventListener('echo-toast', on)
  }, [])
  return <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>
}

// Disguised voice note player (demo)
export function VoiceNote({ id, length }) {
  const [pos, setPos] = useState(-1)
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const bars = Array.from({ length: 40 }, (_, i) => 6 + Math.abs(Math.sin(i * 1.7 + seed)) * 22)
  const play = () => {
    if (pos >= 0) return
    let i = 0
    const t = setInterval(() => { i++; setPos(i); if (i > bars.length) { clearInterval(t); setPos(-1) } }, 70)
  }
  return (
    <>
      <div className="voice">
        <button className="play" onClick={play}>{pos >= 0 ? <Pause size={15} /> : <Play size={15} />}</button>
        <div className="wave">{bars.map((h, i) => <i key={i} className={i < pos ? 'p' : ''} style={{ height: h }} />)}</div>
        <span className="vt">{length}</span>
      </div>
      <div className="vnote">Voice disguised · transcript below</div>
    </>
  )
}

export const AVBG = ['var(--blue-soft)', 'var(--pink-soft)', 'var(--lav-soft)', 'var(--mint-soft)', 'var(--peach-soft)', 'var(--cream-2)']
export const avatarBg = (id) => AVBG[String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVBG.length]

// Neutral avatar (no emoji)
export const Avatar = ({ id, size = 40 }) => <span className="ava" style={{ background: avatarBg(id), width: size, height: size }}><UserRound size={size * 0.5} /></span>
