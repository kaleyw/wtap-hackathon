import { useState } from 'react'
import { useStore } from './store'
import { AI_ENABLED } from './ai/moderate'
import InternApp from './components/InternApp'
import Dashboard from './components/Dashboard'
import { Toaster } from './components/ui'
import { Moon, RotateCcw, ShieldCheck } from 'lucide-react'

const VIEWS = [['intern', 'Co-ops & new grads'], ['team', 'Early Talent team']]

export default function App() {
  const { dispatch } = useStore()
  const [view, setView] = useState('intern')
  const toggleTheme = () => {
    const r = document.documentElement
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    r.dataset.theme = dark ? 'light' : 'dark'
  }
  return (
    <>
      <header className="top">
        <div className="brand"><span className="mk">ılıl</span>RBC Candor<small>AI Group · Early Talent</small></div>
        <div className="views">
          {VIEWS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => { setView(k); window.scrollTo(0, 0) }}>{l}</button>)}
        </div>
        {view === 'intern' && <span title={AI_ENABLED ? 'Echo Shield is using Claude' : 'Echo Shield is using its built-in rules'} style={{ fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={14} /> Shield {AI_ENABLED ? '· Claude' : '· offline'}
        </span>}
        <button className="theme-btn" title="Reset demo data" onClick={() => { if (confirm('Reset the demo data?')) dispatch({ type: 'RESET' }) }}><RotateCcw size={16} className="mx-auto" /></button>
        <button className="theme-btn" title="Toggle light/dark" onClick={toggleTheme}><Moon size={16} className="mx-auto" /></button>
      </header>
      {view === 'intern' ? <InternApp /> : <Dashboard />}
      <Toaster />
    </>
  )
}
