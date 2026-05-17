// ──────────────────────────────────────────────
// src/api/activities.js  —  Activity log endpoints
// ──────────────────────────────────────────────
// GET /workspaces/:wId/activities           → list
// GET /workspaces/:wId/activities/task/:tId → listForTask
// ──────────────────────────────────────────────

import { get } from './client';

export function listActivities(workspaceId, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ page, pageSize });
  return get(`/workspaces/${workspaceId}/activities?${params}`);
}

export function listActivitiesForTask(workspaceId, taskId) {
  return get(`/workspaces/${workspaceId}/activities/task/${taskId}`);
}
