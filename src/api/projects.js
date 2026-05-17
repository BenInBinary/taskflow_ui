// ──────────────────────────────────────────────
// src/api/projects.js  —  Project endpoints
// ──────────────────────────────────────────────
// POST   /workspaces/:wId/projects       → create
// GET    /workspaces/:wId/projects       → list
// GET    /workspaces/:wId/projects/:id   → getById
// PATCH  /workspaces/:wId/projects/:id   → update
// DELETE /workspaces/:wId/projects/:id   → remove
// ──────────────────────────────────────────────

import { get, post, patch, del } from './client';

function base(workspaceId) {
  return `/workspaces/${workspaceId}/projects`;
}

export function createProject(workspaceId, name, description) {
  return post(base(workspaceId), { name, description });
}

export function listProjects(workspaceId) {
  return get(base(workspaceId));
}

export function getProject(workspaceId, projectId) {
  return get(`${base(workspaceId)}/${projectId}`);
}

export function updateProject(workspaceId, projectId, data) {
  return patch(`${base(workspaceId)}/${projectId}`, data);
}

export function removeProject(workspaceId, projectId) {
  return del(`${base(workspaceId)}/${projectId}`);
}
