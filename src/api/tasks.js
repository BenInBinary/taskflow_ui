// ──────────────────────────────────────────────
// src/api/tasks.js  —  Task endpoints
// ──────────────────────────────────────────────
// POST   .../tasks         → create
// GET    .../tasks         → list  (with filters)
// GET    .../tasks/:id     → getById
// GET    .../tasks/:id/subtree → getSubtree
// PATCH  .../tasks/:id     → update
// DELETE .../tasks/:id     → remove
// ──────────────────────────────────────────────

import { get, post, patch, del } from './client';

function base(workspaceId, projectId) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks`;
}

export function createTask(workspaceId, projectId, data) {
  // data = { title, description?, status?, priority?, dueAt?, assigneeId?, parentTaskId? }
  return post(base(workspaceId, projectId), data);
}

export function listTasks(workspaceId, projectId, query = {}) {
  // query = { status?, priority?, assigneeId?, search?, page?, pageSize? }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return get(`${base(workspaceId, projectId)}${qs ? '?' + qs : ''}`);
}

export function getTask(workspaceId, projectId, taskId) {
  return get(`${base(workspaceId, projectId)}/${taskId}`);
}

export function getSubtree(workspaceId, projectId, taskId) {
  return get(`${base(workspaceId, projectId)}/${taskId}/subtree`);
}

export function updateTask(workspaceId, projectId, taskId, data) {
  return patch(`${base(workspaceId, projectId)}/${taskId}`, data);
}

export function removeTask(workspaceId, projectId, taskId) {
  return del(`${base(workspaceId, projectId)}/${taskId}`);
}
