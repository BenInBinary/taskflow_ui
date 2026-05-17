// ──────────────────────────────────────────────
// src/api/workspaces.js  —  Workspace endpoints
// ──────────────────────────────────────────────
// POST   /workspaces                        → create
// GET    /workspaces                        → listMine
// GET    /workspaces/:id                    → getById
// GET    /workspaces/:id/members            → listMembers
// POST   /workspaces/:id/members            → addMember
// PATCH  /workspaces/:id/members/:memberId  → updateMemberRole
// DELETE /workspaces/:id/members/:memberId  → removeMember
// ──────────────────────────────────────────────

import { get, post, patch, del } from './client';

export function createWorkspace(name, description) {
  return post('/workspaces', { name, description });
}

export function listMyWorkspaces() {
  return get('/workspaces');
}

export function getWorkspace(id) {
  return get(`/workspaces/${id}`);
}

export function listMembers(workspaceId) {
  return get(`/workspaces/${workspaceId}/members`);
}

export function addMember(workspaceId, email, role) {
  return post(`/workspaces/${workspaceId}/members`, { email, role });
}

export function updateMemberRole(workspaceId, memberId, role) {
  return patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
}

export function removeMember(workspaceId, memberId) {
  return del(`/workspaces/${workspaceId}/members/${memberId}`);
}
