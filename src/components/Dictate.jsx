import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { toast } from './ui'

// Accessibility: speech-to-text into the box. Nothing is recorded or stored as audio.
// Uses the browser's built-in speech recognition; falls back to a sample sentence in the demo.
const SAMPLE = 'Had a really good one-on-one with my manager today. We talked about me owning the evaluation pipeline next sprint.'

export default function Dictate({ onText, className = '' }) {
  const [on, setOn] = useState(false)
  const rec = useRef(null)
  useEffect(() => () => rec.current?.abort?.(), [])

  const fallback = () => { onText(SAMPLE); setOn(false); toast('Dictation added to your text (demo sample)') }

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return fallback()
    try {
      const r = new SR()
      r.lang = 'en-CA'; r.continuous = true; r.interimResults = false
      let heard = false
      r.onresult = (e) => {
        const text = Array.from(e.results).slice(e.resultIndex).filter((x) => x.isFinal).map((x) => x[0].transcript).join(' ').trim()
        if (text) { heard = true; onText(text) }
      }
      r.onerror = () => { if (!heard) fallback() }
      r.onend = () => setOn(false)
      r.start(); rec.current = r; setOn(true)
    } catch { fallback() }
  }
  const stop = () => { rec.current?.stop(); setOn(false) }

  return (
    <button type="button" className={`btn ghost small ${className}`} onClick={on ? stop : start} aria-pressed={on} title="Speak instead of typing. Your words are turned into text; no audio is kept.">
      {on ? <><Square size={13} fill="currentColor" /> Listening… tap to stop</> : <><Mic size={15} /> Dictate</>}
    </button>
  )
}
