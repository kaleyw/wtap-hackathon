import { K_ANON, LOBS, LOBSHORT, PROVINCES, ROLES } from '../data/seed'
import { bigOffices, bigProvinces, OTHER } from '../lib'

// Shared filter bar: co-op/new grad and line-of-business filters, plus province and office (5+ rule)
export default function Filters({ f, set }) {
  const offices = bigOffices().filter((o) => !f.province || f.province === OTHER || o.province === f.province)
  return (
    <div className="filters">
      <span className="flabel">Filter</span>
      <select className="sel" value={f.role || ''} onChange={(e) => set({ role: e.target.value })}>
        <option value="">Co-ops & new grads</option>{ROLES.map((r) => <option key={r} value={r}>{r === 'Co-op' ? 'Co-ops only' : 'New grads only'}</option>)}
      </select>
      <select className="sel" value={f.lob} onChange={(e) => set({ lob: e.target.value })}>
        <option value="">All lines of business</option>{Object.keys(LOBS).map((l) => <option key={l}>{l}</option>)}
      </select>
      <select className="sel" value={f.province} onChange={(e) => set({ province: e.target.value, office: '' })}>
        <option value="">All provinces</option>{bigProvinces().map((p) => <option key={p} value={p}>{PROVINCES[p]}</option>)}<option value={OTHER}>Other provinces</option>
      </select>
      <select className="sel" value={f.office} onChange={(e) => set({ office: e.target.value })}>
        <option value="">All offices</option>{(f.province === OTHER ? [] : offices).map((o) => <option key={o.name}>{o.name}</option>)}<option value={OTHER}>Other offices</option>
      </select>
      <span className="fsum">{f.role ? `${f.role}s` : 'All early talent'} · {f.lob ? LOBSHORT[f.lob] : 'All LOBs'} · groups under {K_ANON} hidden</span>
    </div>
  )
}

