import { CIRCLE_THRESHOLD, HEADCOUNT, K_ANON, OFFICES, PROVINCES } from './data/seed'

// "Hot" ranking: echoes decay with age, so a post getting echoes fast beats an old popular one.
export const hotScore = (p) => p.echoes / Math.pow((Date.now() - p.at) / 3600_000 + 2, 0.8)

export function trendingPostIds(posts, n = 3) {
  return new Set([...posts].filter((p) => p.echoes >= 5).sort((a, b) => hotScore(b) - hotScore(a)).slice(0, n).map((p) => p.id))
}

export const circleOpen = (g) => g.people.length >= CIRCLE_THRESHOLD && Object.keys(g.teams).length >= 2

// One stable accent colour per theme, used for group chips and borders
export const THEME_COLOR = {
  Mentorship: '#df7aa3',
  Onboarding: '#7fa9e0',
  'Team dynamics': '#cf7b4a',
  'Career growth': '#9b8ce0',
  Workload: '#c9454f',
  Wins: '#3f9a72',
}

// ---- Location privacy: only show what at least K_ANON interns share ----

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0)
export const provinceOf = (office) => OFFICES.find((o) => o.name === office)?.province
export const officeCount = (office, team) => (team ? HEADCOUNT[office]?.[team] || 0 : sum(HEADCOUNT[office]))
export const provinceCount = (prov, team) => OFFICES.filter((o) => o.province === prov).reduce((a, o) => a + officeCount(o.name, team), 0)

export const OTHER = '__other'
export const bigOffices = () => OFFICES.filter((o) => officeCount(o.name) >= K_ANON)
export const smallOffices = () => OFFICES.filter((o) => officeCount(o.name) < K_ANON)
export const bigProvinces = () => Object.keys(PROVINCES).filter((p) => provinceCount(p) >= K_ANON)

// The most specific location label that still covers 5+ interns on this team
export function safeLocation(team, office) {
  if (!office || officeCount(office) < K_ANON) return 'Other office'
  if (officeCount(office, team) >= K_ANON) return office
  const prov = provinceOf(office)
  if (provinceCount(prov, team) >= K_ANON) return PROVINCES[prov]
  return 'Location hidden'
}

// Does an intern's office match the province/office filters?
export function matchesLocation(office, provFilter, officeFilter) {
  const prov = provinceOf(office)
  if (provFilter === OTHER && provinceCount(prov) >= K_ANON) return false
  if (provFilter && provFilter !== OTHER && prov !== provFilter) return false
  if (officeFilter === OTHER && officeCount(office) >= K_ANON) return false
  if (officeFilter && officeFilter !== OTHER && office !== officeFilter) return false
  return true
}

// How many interns are in the audience a set of filters selects. Under 5 = hide results.
export function audienceSize({ team, province, office }) {
  return OFFICES.filter((o) => matchesLocation(o.name, province, office)).reduce((a, o) => a + officeCount(o.name, team || undefined), 0)
}
