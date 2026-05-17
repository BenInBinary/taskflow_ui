// ──────────────────────────────────────────────
// src/api/comments.js  —  Comment endpoints
// ──────────────────────────────────────────────
// POST   .../tasks/:taskId/comments       → create
// GET    .../tasks/:taskId/comments       → list
// PATCH  .../tasks/:taskId/comments/:id   → update
// DELETE .../tasks/:taskId/comments/:id   → remove
// ──────────────────────────────────────────────

import { get, post, patch, del } from './client';

function base(workspaceId, projectId, taskId) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`;
}

export function createComment(workspaceId, projectId, taskId, body, parentCommentId) {
  return post(base(workspaceId, projectId, taskId), { body, parentCommentId });
}

export function listComments(workspaceId, projectId, taskId) {
  return get(base(workspaceId, projectId, taskId));
}

export function updateComment(workspaceId, projectId, taskId, commentId, body) {
  return patch(`${base(workspaceId, projectId, taskId)}/${commentId}`, { body });
}

export function removeComment(workspaceId, projectId, taskId, commentId) {
  return del(`${base(workspaceId, projectId, taskId)}/${commentId}`);
}
