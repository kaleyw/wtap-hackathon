// Two-way status sync with project tools. Moving a card on the Candor board updates the ticket in its tool.
//
// The demo simulates the network call (no company sign-in here), but each adapter shows the exact request
// production would make, using the person's own OAuth token so they can only move their own tickets.

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export const TRACKERS = {
  jira: {
    name: 'Jira',
    // Jira moves issues through workflow transitions; production looks up the transition id first
    // with GET /rest/api/3/issue/{key}/transitions, then posts it.
    statusMap: { 'To do': 'To Do', 'In progress': 'In Progress', Done: 'Done' },
    request: (t, remote) => `POST /rest/api/3/issue/${t.id}/transitions  { "transition": { "id": "<id for “${remote}”>" } }`,
  },
  github: {
    name: 'GitHub Projects',
    // GitHub Projects (v2) stores status as a single-select field on the project item
    statusMap: { 'To do': 'Todo', 'In progress': 'In Progress', Done: 'Done' },
    request: (t, remote) => `GraphQL updateProjectV2ItemFieldValue(projectId, itemId: ${t.id}, field: "Status", value: "${remote}")`,
  },
  ado: {
    name: 'Azure DevOps',
    // Azure DevOps work items change state with a JSON Patch on System.State
    statusMap: { 'To do': 'New', 'In progress': 'Active', Done: 'Closed' },
    request: (t, remote) => `PATCH _apis/wit/workitems/${t.id.replace('AB#', '')}?api-version=7.1  [{ "op": "replace", "path": "/fields/System.State", "value": "${remote}" }]`,
  },
}

export async function syncStatus(task, status) {
  const tracker = TRACKERS[task.source]
  const remote = tracker.statusMap[status]
  await wait(700) // demo: simulated round trip
  return { ok: true, tool: tracker.name, remote, request: tracker.request(task, remote) }
}
