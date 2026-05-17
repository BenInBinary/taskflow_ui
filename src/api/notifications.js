// ──────────────────────────────────────────────
// src/api/notifications.js  —  Notification endpoints
// ──────────────────────────────────────────────
// GET   /notifications            → list (page, limit, unread)
// PATCH /notifications/read-all   → markAllAsRead
// PATCH /notifications/:id/read   → markAsRead
// ──────────────────────────────────────────────

import { get, patch } from './client';

export function listNotifications(page = 1, limit = 20, unread = false) {
  const params = new URLSearchParams({ page, limit, unread });
  return get(`/notifications?${params}`);
}

export function markAllAsRead() {
  return patch('/notifications/read-all', {});
}

export function markAsRead(id) {
  return patch(`/notifications/${id}/read`, {});
}
