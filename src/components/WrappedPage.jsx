import { AudioLines, BarChart3, Lightbulb, Mic, Sparkles, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { MY_HISTORY, MY_WRAPPED_EXTRAS as X } from '../data/seed'
import { toast } from './ui'
import Wrapped from './Wrapped'

// Their Wrapped page layout, filled with the intern's own data; "Play" opens the full recap
export default function WrappedPage() {
  const { state } = useStore()
  const [play, setPlay] = useState(false)
  const entries = 24 + state.notes.length
  const points = [
    'Presented my work twice, including at demo day',
    `Built up skills in ${X.skills.slice(0, 3).map((s) => s.name).join(', ')}`,
    `Proposed “${X.topFix.text.toLowerCase()}”, which ${X.topFix.votes} other early talent backed`,
    `Worked with ${X.peopleMentioned} people across the team`,
  ]
  const copy = () => { navigator.clipboard?.writeText(points.map((p) => `• ${p}`).join('\n')).catch(() => {}); toast('Talking points copied for your final review ') }
  return (
    <section>
      <div className="pagehead">
        <div><h1>Your term, wrapped</h1><p>Built privately from your notes, tickets and posts</p></div>
        <div className="row" style={{ marginLeft: 'auto' }}>
          <button className="btn ghost" onClick={copy}>Turn into review talking points</button>
          <button className="btn pink" onClick={() => setPlay(true)}>▶ Play your Wrapped</button>
        </div>
      </div>
      <div className="wgrid">
        <div className="card wr wr1"><span className="emo"><Mic size={44} /></span><div className="eyebrow">You wrote</div><div className="big">{entries} notes</div><p className="sub">And spoke up on Echo {MY_HISTORY.length + state.posts.filter((p) => p.authorId === 'p-me').length} times.</p></div>
        <div className="card wr wr2"><span className="emo"><Sparkles size={44} /></span><div className="eyebrow">Your most energized moments</div><div className="big">Presenting</div><p className="sub">Your entries got brighter every time you demoed your work.</p></div>
        <div className="card wr wr3"><span className="emo"><Users size={44} /></span><div className="eyebrow">Your people</div><div className="big">{X.peopleMentioned} new names</div><p className="sub">Counted on your device. Names are never stored or sent anywhere.</p></div>
        <div className="card wr wr4"><span className="emo"><BarChart3 size={44} /></span><div className="eyebrow">Your top skill</div><div className="big">Learning {X.skills[0].name}</div><p className="sub">Use it as a talking point in your final review.</p></div>
        <div className="card wr wr2"><span className="emo"><AudioLines size={44} /></span><div className="eyebrow">You weren't alone</div><div className="big">{X.echoesReceived} echoes</div><p className="sub">People who echoed what you said. You echoed {X.echoesGiven + state.myEchoes.length} others.</p></div>
        <div className="card wr wr1"><span className="emo"><Lightbulb size={44} /></span><div className="eyebrow">Your idea got traction</div><div className="big">{X.topFix.votes} votes</div><p className="sub">“{X.topFix.text}”, suggested in your Circle.</p></div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Talking points for your final review</h3>
        <ul className="mt-2 space-y-1 pl-5" style={{ listStyle: 'disc' }}>{points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
      {play && <Wrapped onClose={() => setPlay(false)} />}
    </section>
  )
}
