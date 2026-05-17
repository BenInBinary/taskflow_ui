// ──────────────────────────────────────────────
// src/utils/notificationText.js
// ──────────────────────────────────────────────
// The backend Notification entity has these fields:
//   { id, userId, type, title, body, payload (JSONB), read, createdAt }
//
// The processor already builds human-readable `title` + `body`:
//   task_assigned   → title: "New task assigned",        body: '"Task X" was assigned to you'
//   due_reminder    → title: "Task due soon",            body: '"Task X" is due soon'
//   comment_mention → title: "Alice mentioned you",      body: excerpt
//   status_changed  → title: "Task status updated",      body: '"Task X" moved from TODO to DONE'
//
// We prefer `title` + `body` (human-readable from backend).
// Only fallback to payload if title/body are missing.
// ──────────────────────────────────────────────

export function renderNotificationText(notification) {
  // Prefer backend's pre-built human-readable title + body
  if (notification.title && notification.body) {
    return `${notification.title}: ${notification.body}`;
  }
  if (notification.title) {
    return notification.title;
  }
  if (notification.body) {
    return notification.body;
  }

  // Fallback: build from type + payload (for live WebSocket events
  // which might be sent before the entity is fully hydrated)
  const { type, payload } = notification;
  if (!payload) return `New notification: ${type}`;

  switch (type) {
    case 'task_assigned':
      return `You were assigned to "${payload.taskTitle || 'a task'}"`;

    case 'due_reminder':
      return `"${payload.taskTitle || 'A task'}" is due soon${payload.dueAt ? ` (${formatDate(payload.dueAt)})` : ''}`;

    case 'comment_mention':
      return `You were mentioned in "${payload.taskTitle || 'a task'}"${payload.excerpt ? `: "${truncate(payload.excerpt, 60)}"` : ''}`;

    case 'status_changed':
      return `"${payload.taskTitle || 'A task'}" status: ${formatStatus(payload.oldStatus)} → ${formatStatus(payload.newStatus)}`;

    default:
      return `Notification: ${type}`;
  }
}

// ─── Helpers ──────────────────────────────────

function formatStatus(status) {
  if (!status) return '?';
  return status.replace(/_/g, ' ');
}

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
