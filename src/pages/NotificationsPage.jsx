// ──────────────────────────────────────────────
// src/pages/NotificationsPage.jsx
// ──────────────────────────────────────────────
// Backend notification shape (from notification.entity.ts):
//   { id, userId, type, title, body, payload (JSONB), read, createdAt }
//
// type: task_assigned | due_reminder | comment_mention | status_changed
//
// The processor builds human-readable `title` and `body` fields:
//   task_assigned   → title: "New task assigned",      body: '"Task X" was assigned to you'
//   due_reminder    → title: "Task due soon",          body: '"Task X" is due soon'
//   comment_mention → title: "Bob mentioned you",      body: 'the excerpt text'
//   status_changed  → title: "Task status updated",    body: '"Task X" moved from TODO to DONE'
// ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { listNotifications, markAsRead, markAllAsRead } from '../api/notifications';
import { useSocket } from '../context/SocketContext';
import { renderNotificationText } from '../utils/notificationText';
import toast from 'react-hot-toast';

// Icon per notification type
const TYPE_ICON = {
  task_assigned:   '📋',
  due_reminder:    '⏰',
  comment_mention: '💬',
  status_changed:  '🔄',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnread, setShowUnread] = useState(false);
  const { liveNotifications, resetUnreadCount } = useSocket();

  async function load() {
    setLoading(true);
    try {
      const data = await listNotifications(1, 50, showUnread);
      // API returns { data, total, page, limit }
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [showUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset sidebar badge when user visits this page
  useEffect(() => { resetUnreadCount(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge live notifications into the list (avoid duplicates)
  useEffect(() => {
    if (liveNotifications.length === 0) return;
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes = liveNotifications.filter(n => !existingIds.has(n.id));
      return [...newOnes, ...prev];
    });
  }, [liveNotifications]);

  async function handleMarkRead(id) {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      toast.success('All marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>🔔 Notifications</h2>
          <div className="page-header-sub">{notifications.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showUnread} onChange={e => setShowUnread(e.target.checked)} />
            Unread only
          </label>
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state glass-card">
          <h3>No notifications</h3>
          <p>You're all caught up! 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n, idx) => (
            <div
              key={n.id}
              className="glass-card animate-fade-in"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                animationDelay: `${idx * 0.03}s`,
                borderLeft: n.read ? 'none' : '3px solid var(--accent)',
                opacity: n.read ? 0.7 : 1,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                {TYPE_ICON[n.type] || '🔔'}
              </span>

              {/* Content — use backend title+body (human-readable) */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: n.read ? 400 : 600 }}>
                  {renderNotificationText(n)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  {n.type.replace(/_/g, ' ')} • {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              {!n.read && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(n.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
