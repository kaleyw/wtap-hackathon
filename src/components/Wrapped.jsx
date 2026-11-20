import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts'
import { ChevronLeft, ChevronRight, Copy, Lock, X } from 'lucide-react'
import { useStore } from '../store'
import { ME, MY_HISTORY, MY_WRAPPED_EXTRAS as X_ } from '../data/seed'

// Private end-of-term recap, built only from this intern's own posts.
export default function Wrapped({ onClose }) {
  const { state, dispatch } = useStore()
  const [i, setI] = useState(0)
  const [copied, setCopied] = useState(false)

  const livePosts = state.posts.filter((p) => p.authorId === ME.id)
  const spoke = MY_HISTORY.length + livePosts.length
  const echoesGiven = X_.echoesGiven + state.myEchoes.length
  const themeCount = {}
  MY_HISTORY.forEach((h) => { themeCount[h.theme] = (themeCount[h.theme] || 0) + 1 })
  const topTheme = Object.entries(themeCount).sort((a, b) => b[1] - a[1])[0][0]
  const firstTheme = MY_HISTORY[0].theme
  const momentCount = {}
  MY_HISTORY.filter((h) => h.moment).forEach((h) => { momentCount[h.moment] = (momentCount[h.moment] || 0) + 1 })
  const moments = Object.entries(momentCount).sort((a, b) => b[1] - a[1])
  const topMoment = moments[0][0]
  const mood = MY_HISTORY.map((h) => ({ week: `W${h.week}`, mood: h.mood }))
  const dip = MY_HISTORY.reduce((a, b) => (b.mood < a.mood ? b : a))
  const circles = 2 + state.myCircles.length
  const topSkill = X_.skills[0]

  const talkingPoints = [
    `Presented my work twice, including at demo day`,
    `Built up skills in ${X_.skills.slice(0, 3).map((s) => s.name).join(', ')}`,
    `Proposed “${X_.topFix.text.toLowerCase()}”, which ${X_.topFix.votes} other early talent backed`,
    `Worked with ${X_.peopleMentioned} people across the team`,
  ]

  const slides = [
    {
      bg: 'from-[#34507f] via-[#5a86c4] to-[#e8a3c0]',
      body: (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">This term</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">Your term,<br />Echoed.</h1>
          <p className="mt-6 text-lg text-[#fff]/80">16 weeks. Here’s what you said, what lit you up, and what to bring to your final review.</p>
          <p className="mt-8 flex items-center gap-1.5 text-xs text-[#fff]/80"><Lock size={13} /> Only you can see this. Nothing here has your name on it for RBC.</p>
        </>
      ),
    },
    {
      bg: 'from-[#7463c9] to-[#df7aa3]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">You spoke up</p>
          <h1 className="text-8xl font-black">{spoke}</h1>
          <p className="text-2xl font-semibold">times</p>
          <p className="mt-8 text-lg text-[#fff]/80">and echoed <b className="text-[#fff]">{echoesGiven}</b> posts from <b className="text-[#fff]">{X_.echoTeams}</b> different teams.</p>
          <p className="mt-2 text-lg text-[#fff]/80"><b className="text-[#fff]">{X_.echoesReceived}</b> people echoed you back. You were never the only one.</p>
        </>
      ),
    },
    {
      bg: 'from-[#2b7a55] to-[#5a86c4]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">You were most energized</p>
          <h1 className="mt-2 text-5xl font-black leading-tight">{topMoment.replace('Presenting your work', 'when presenting')}</h1>
          <div className="mt-8 space-y-2">
            {moments.map(([m, n]) => (
              <div key={m} className="flex items-center justify-between rounded-xl bg-[#fff]/15 px-4 py-2.5 text-lg"><span>{m}</span>{n > 1 && <b>{n}×</b>}</div>
            ))}
          </div>
        </>
      ),
    },
    {
      bg: 'from-[#cf7b4a] to-[#df7aa3]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">Your top theme</p>
          <h1 className="text-6xl font-black">{topTheme}</h1>
          <p className="mt-6 text-xl">You started the term talking about <b>{firstTheme.toLowerCase()}</b>. You finished it talking about <b>{topTheme.toLowerCase()}</b>.</p>
          <p className="mt-8 text-lg text-[#fff]/80">Top skill you mentioned</p>
          <p className="text-4xl font-black">{topSkill.name} <span className="text-2xl font-semibold text-[#fff]/80">· {topSkill.n} times</span></p>
        </>
      ),
    },
    {
      bg: 'from-[#4a6da3] to-[#7463c9]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">You mentioned</p>
          <h1 className="text-8xl font-black">{X_.peopleMentioned}</h1>
          <p className="text-2xl font-semibold">different people</p>
          <p className="mt-6 text-lg text-[#fff]/80">Mentors, teammates, the director at demo day. Your network grew all term.</p>
          <p className="mt-6 flex items-start gap-1.5 text-xs text-[#fff]/80"><Lock size={13} className="mt-px shrink-0" /> Counted on your device before names were removed. Names are never stored or sent anywhere.</p>
        </>
      ),
    },
    {
      bg: 'from-[#1f2b45] to-[#34507f]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">Your term, week by week</p>
          <div className="mt-4 h-48 rounded-xl bg-[#fff]/5 p-2">
            <ResponsiveContainer>
              <AreaChart data={mood} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd200" stopOpacity={0.6} /><stop offset="100%" stopColor="#ffd200" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="week" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[-2.5, 2.5]} tick={false} axisLine={false} />
                <ReferenceLine y={0} stroke="#475569" />
                <Area type="monotone" dataKey="mood" stroke="#ffd200" strokeWidth={2.5} fill="url(#m)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-5 text-xl">Your low point was <b>week {dip.week}</b>, when “{dip.text.split('.')[0].toLowerCase()}.”</p>
          <p className="mt-2 text-lg text-[#fff]/80">Week 6 is the hardest week for most co-ops and new grads. You bounced back to your best weeks right after.</p>
        </>
      ),
    },
    {
      bg: 'from-[#df7aa3] to-[#cf7b4a]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">You helped change things</p>
          <h1 className="text-6xl font-black">{circles} Circles</h1>
          <p className="mt-4 text-xl">Your idea, <b>“{X_.topFix.text}”</b>, got <b>{X_.topFix.votes}</b> votes.</p>
          <p className="mt-6 text-lg text-[#fff]/80">Onboarding, which you posted about in week 1, now has laptops ready before day 1 for the next group of co-ops and new grads. You said it, they did it.</p>
        </>
      ),
    },
    {
      bg: 'from-[#34507f] to-[#5a86c4]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">Talking points for your final review</p>
          <ul className="mt-4 space-y-3">
            {talkingPoints.map((t) => <li key={t} className="rounded-xl bg-[#fff]/10 px-4 py-3 text-lg">✓ {t}</li>)}
          </ul>
          <button onClick={() => { navigator.clipboard?.writeText(talkingPoints.map((t) => `• ${t}`).join('\n')).catch(() => {}); setCopied(true) }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#1f2b45]">
            <Copy size={15} /> {copied ? 'Copied!' : 'Copy talking points'}
          </button>
        </>
      ),
    },
    {
      bg: 'from-[#34507f] to-[#7463c9]',
      body: (
        <>
          <p className="text-lg text-[#fff]/80">One last thing</p>
          <h1 className="text-5xl font-black leading-tight">Would you come back?</h1>
          <div className="mt-8 flex flex-col gap-3">
            {[['yes', 'Yes, I’d love to'], ['maybe', 'Maybe, depends on the team'], ['no', 'Not this time']].map(([k, l]) => (
              <button key={k} onClick={() => dispatch({ type: 'SET_RETURN_INTENT', value: k })}
                className={`rounded-xl px-5 py-3 text-left text-lg font-semibold transition ${state.returnIntent === k ? 'bg-accent text-[#1f2b45]' : 'bg-[#fff]/15 hover:bg-[#fff]/25'}`}>{l}</button>
            ))}
          </div>
          <p className="mt-6 text-sm text-[#fff]/80">{state.returnIntent ? 'Thanks. Your answer was added anonymously to the program’s end-of-term report.' : 'Your answer is anonymous and only counted in the program totals.'}</p>
        </>
      ),
    },
  ]

  const s = slides[i]
  const go = (d) => setI((x) => Math.min(slides.length - 1, Math.max(0, x + d)))

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1e2841]/80 p-4">
      <div className={`relative flex h-[min(720px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${s.bg} text-[#fff] shadow-2xl`}>
        <div className="flex gap-1 p-4">{slides.map((_, k) => <div key={k} className={`h-1 flex-1 rounded-full ${k <= i ? 'bg-white' : 'bg-[#fff]/30'}`} />)}</div>
        <button onClick={onClose} className="absolute right-3 top-7 rounded-full p-1.5 hover:bg-[#fff]/15"><X size={20} /></button>
        <div className="flex flex-1 flex-col justify-center overflow-y-auto px-8 pb-6">{s.body}</div>
        <div className="flex items-center justify-between px-4 pb-4">
          <button onClick={() => go(-1)} disabled={i === 0} className="rounded-full p-2 hover:bg-[#fff]/15 disabled:opacity-30"><ChevronLeft size={22} /></button>
          <span className="text-xs text-[#fff]/70">{i + 1} / {slides.length}</span>
          {i < slides.length - 1
            ? <button onClick={() => go(1)} className="rounded-full p-2 hover:bg-[#fff]/15"><ChevronRight size={22} /></button>
            : <button onClick={onClose} className="rounded-full bg-[#fff] px-4 py-1.5 text-sm font-semibold text-[#1f2b45]">Done</button>}
        </div>
      </div>
    </div>
  )
}
