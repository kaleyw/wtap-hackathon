import { createContext, useContext, useEffect, useReducer } from 'react'
import { CURRENT_WEEK, ME, SEED_NOTES, SHIELD_BASE, WORK_TASKS, seedActions, seedGroups, seedPosts, seedSensitive, seedThreads } from './data/seed'

const KEY = 'candor-v1'
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`

const initial = () => ({
  groups: seedGroups,
  posts: seedPosts,
  threads: seedThreads,
  actions: seedActions,
  sensitive: seedSensitive,
  held: [], // messages the AI kept back (blocked / crisis); no identity attached
  myEchoes: [],
  myCircles: [],
  myAliases: {}, // groupId -> per-thread alias, so posts can't be linked across threads
  nudge: null,
  returnIntent: null,
  shield: SHIELD_BASE,
  notes: SEED_NOTES,
  workTasks: WORK_TASKS,
  syncLog: [],
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage unavailable: start fresh */ }
  return initial()
}

const ADJ = ['Quiet', 'Bright', 'Calm', 'Bold', 'Amber', 'Silver', 'Swift', 'Gentle', 'Misty', 'Sunny']
const ANIMAL = ['Otter', 'Finch', 'Lynx', 'Marten', 'Kite', 'Wren', 'Fox', 'Robin', 'Badger', 'Heron']
const randomAlias = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${ANIMAL[Math.floor(Math.random() * ANIMAL.length)]}`

function addPerson(group, team) {
  if (group.people.includes(ME.id)) return group
  return { ...group, people: [...group.people, ME.id], teams: { ...group.teams, [team]: (group.teams[team] || 0) + 1 }, offices: { ...group.offices, [ME.office]: (group.offices?.[ME.office] || 0) + 1 } }
}

function reducer(state, a) {
  switch (a.type) {
    case 'ADD_POST': {
      const { text, theme, groupId, newGroupTitle, followUp, sensitive, signals, keywords } = a
      let groups = state.groups
      let gid = groupId
      if (!gid) {
        gid = uid('g')
        groups = [...groups, { id: gid, title: newGroupTitle || text.slice(0, 50), theme, keywords: keywords || [], people: [], teams: {}, offices: {}, sentiment: -0.3, growth: 1, isNew: true }]
      }
      groups = groups.map((g) => (g.id === gid ? addPerson(g, ME.team) : g))
      const post = { id: uid('p'), role: ME.role, groupId: gid, team: ME.team, office: ME.office, shield: a.shield, text, echoes: 0, at: Date.now(), authorId: ME.id, followUp, sensitive: !!sensitive }
      const next = { ...state, groups, posts: [post, ...state.posts] }
      if (sensitive) {
        next.sensitive = [{ id: uid('s'), postId: post.id, category: sensitive, team: ME.team, at: Date.now(), text, sealed: { name: ME.realName, email: ME.email, team: ME.team, alias: ME.alias }, unsealed: false, audit: [] }, ...state.sensitive]
      }
      if (signals?.length) next.nudge = { signals, groupId: a.nudgeGroup || gid }
      return next
    }
    case 'ECHO': {
      const post = state.posts.find((p) => p.id === a.postId)
      if (!post || post.authorId === ME.id) return state
      if (state.myEchoes.includes(post.id)) { // un-echo
        return { ...state, myEchoes: state.myEchoes.filter((x) => x !== post.id), posts: state.posts.map((p) => (p.id === post.id ? { ...p, echoes: p.echoes - 1 } : p)) }
      }
      return {
        ...state,
        myEchoes: [...state.myEchoes, post.id],
        posts: state.posts.map((p) => (p.id === post.id ? { ...p, echoes: p.echoes + 1 } : p)),
        groups: state.groups.map((g) => (g.id === post.groupId ? addPerson(g, ME.team) : g)),
      }
    }
    case 'JOIN_CIRCLE': {
      if (state.myCircles.includes(a.groupId)) return state
      return { ...state, myCircles: [...state.myCircles, a.groupId], myAliases: { ...state.myAliases, [a.groupId]: randomAlias() } }
    }
    case 'THREAD_MSG': {
      const msg = { id: uid('t'), alias: a.staff ? 'Early Talent team' : state.myAliases[a.groupId], staff: !!a.staff, text: a.text, at: Date.now(), fix: !!a.fix, fixVotes: a.fix ? 1 : 0, mine: !a.staff, flagged: a.flagged }
      const next = { ...state, threads: { ...state.threads, [a.groupId]: [...(state.threads[a.groupId] || []), msg] } }
      if (a.sensitive) {
        next.sensitive = [{ id: uid('s'), postId: msg.id, category: a.sensitive, team: ME.team, at: Date.now(), text: a.text, where: 'Circle', sealed: { name: ME.realName, email: ME.email, team: ME.team, alias: msg.alias }, unsealed: false, audit: [] }, ...state.sensitive]
      }
      return next
    }
    case 'VOTE_FIX':
      return { ...state, threads: { ...state.threads, [a.groupId]: state.threads[a.groupId].map((m) => (m.id === a.msgId && !m.voted ? { ...m, fixVotes: m.fixVotes + 1, voted: true } : m)) } }
    case 'STAFF_RESPOND': {
      const g = state.groups.find((x) => x.id === a.groupId)
      return { ...state, actions: [{ id: uid('a'), groupId: a.groupId, echoes: g.people.length, response: a.text, status: a.status || 'in progress', at: Date.now(), impact: 'Tracking: results show up in 2 weeks' }, ...state.actions] }
    }
    case 'UNSEAL':
      return { ...state, sensitive: state.sensitive.map((s) => (s.id === a.id ? { ...s, unsealed: true, audit: [...s.audit, { by: 'Early Talent investigator', reason: a.reason, at: Date.now() }] } : s)) }
    case 'STAFF_REPLY_POST':
      return { ...state, posts: state.posts.map((p) => (p.id === a.postId ? { ...p, reply: { text: a.text, at: Date.now() } } : p)) }
    case 'RESPOND_POST': {
      const post = state.posts.find((p) => p.id === a.postId)
      const posts = state.posts.map((p) => (p.id === a.postId ? { ...p, status: 'prog', reply: { text: a.text, at: Date.now() } } : p))
      const hasAction = state.actions.some((x) => x.groupId === post.groupId)
      const actions = hasAction ? state.actions : [{ id: uid('a'), groupId: post.groupId, echoes: post.echoes, response: `${post.echoes} of you echoed this. ${a.text}`, status: 'in progress', at: Date.now(), impact: 'Tracking: results show up in 2 weeks' }, ...state.actions]
      return { ...state, posts, actions }
    }
    case 'MOVE_TASK':
      return { ...state, workTasks: state.workTasks.map((t) => (t.id === a.id ? { ...t, status: a.status, days: 0, blocked: a.status === 'Done' ? false : t.blocked, week: a.status === 'Done' ? CURRENT_WEEK : t.week, sync: 'pending' } : t)) }
    case 'TASK_SYNCED':
      return { ...state, workTasks: state.workTasks.map((t) => (t.id === a.id ? { ...t, sync: a.remote } : t)), syncLog: [{ id: uid('s'), taskId: a.id, tool: a.tool, remote: a.remote, request: a.request, at: Date.now() }, ...state.syncLog].slice(0, 8) }
    case 'REMOVE_NOTE':
      return { ...state, notes: state.notes.filter((n) => n.id !== a.id) }
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, { id: uid('n'), week: CURRENT_WEEK, taskId: a.taskId || null, tags: a.tags || [], text: a.text, at: Date.now(), dictated: a.dictated }] }
    case 'SET_RETURN_INTENT':
      return { ...state, returnIntent: a.value }
    case 'SHIELD_LOG': {
      const r = a.result, sh = { ...state.shield, checked: state.shield.checked + 1 }
      if (r.redactions?.length) sh.names += r.redactions.length
      if (r.generalized?.length) sh.details += r.generalized.length
      if (r.styleSmoothed) sh.style += 1
      if (r.action === 'block' && r.blockKind === 'person') sh.blockedPerson += 1
      if (r.action === 'block' && r.blockKind === 'confidential') sh.confidential += 1
      if (r.action === 'crisis') sh.crisis += 1
      if (a.rewrite) sh.rewritten += 1
      return { ...state, shield: sh }
    }
    case 'HOLD':
      return { ...state, held: [{ id: uid('h'), at: Date.now(), team: ME.team, ...a.item }, ...state.held] }
    case 'DISMISS_NUDGE':
      return { ...state, nudge: null }
    case 'RESET':
      return initial()
    default:
      return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
