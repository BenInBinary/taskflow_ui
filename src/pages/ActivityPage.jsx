// ──────────────────────────────────────────────
// src/pages/ActivityPage.jsx
// ──────────────────────────────────────────────
// Backend activity shape:
//   { id, workspaceId, actorId, type, entityType, entityId, payload (JSONB), createdAt }
//   relations: actor { id, name, email }
//
// Activity types and their payloads:
//   task.created         → { title, projectId }
//   task.updated         → {}
//   task.status_changed  → { from: 'TODO', to: 'DONE' }
//   task.assigned        → { from: userId|null, to: userId|null }  ← UUIDs!
//   task.completed       → {}
//   task.deleted         → {}
//   comment.added        → { taskId, parentCommentId }
//   member.added         → {}
//   member.removed       → {}
//   project.created      → { title }
// ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { listActivities } from '../api/activities';
import { listMembers } from '../api/workspaces';

// Map activity type to emoji + human label
const TYPE_CONFIG = {
  'task.created': { icon: '🟢', label: 'Created task' },
  'task.updated': { icon: '📝', label: 'Updated task' },
  'task.status_changed': { icon: '🔄', label: 'Changed status' },
  'task.assigned': { icon: '👤', label: 'Assigned task' },
  'task.completed': { icon: '✅', label: 'Completed task' },
  'task.deleted': { icon: '🗑️', label: 'Deleted task' },
  'comment.added': { icon: '💬', label: 'Added comment' },
  'member.added': { icon: '👋', label: 'Added member' },
  'member.removed': { icon: '🚪', label: 'Removed member' },
  'member.role_changed': { icon: '👥', label: 'Changed role' },
  'project.created': { icon: '📁', label: 'Created project' },
};

/**
 * Render a human-readable description from the activity payload.
 * @param {string} type - activity type enum
 * @param {object} payload - JSONB payload
 * @param {Map<string, string>} userMap - userId → display name
 */
function renderPayloadDetail(type, payload, userMap) {
  if (!payload || Object.keys(payload).length === 0) return null;

  switch (type) {
    case 'task.status_changed': {
      const from = payload.from?.replace(/_/g, ' ') || '?';
      const to = payload.to?.replace(/_/g, ' ') || '?';
      return `${from} → ${to}`;
    }

    case 'task.assigned': {
      const fromName = payload.from ? (userMap.get(payload.from) || 'Unassigned') : 'Unassigned';
      const toName = payload.to ? (userMap.get(payload.to) || 'Unknown user') : 'Unassigned';
      if (!payload.from && payload.to) {
        return `Assigned to ${toName}`;
      }
      if (payload.from && !payload.to) {
        return `Unassigned from ${fromName}`;
      }
      return `Reassigned: ${fromName} → ${toName}`;
    }

    case 'task.created':
    case 'project.created':
      return payload.title || payload.name || null;

    case 'comment.added':
      // No useful text to show beyond the type label
      return null;

    case 'member.role_changed': {
      const memberName = payload.memberName || 'Unknown';
      const from = payload.prevRole || '?';
      const to = payload.newRole || '?';
      return `${memberName}: ${from} → ${to}`;
    }

    case 'member.added': {
      const role = payload.role ?? payload.newRole ?? 'MEMBER';
      return payload.memberName ? `${payload.memberName} joined as ${role}` : null;
    }

    case 'member.removed': {
      return payload.memberName ? `${payload.memberName} was removed` : null;
    }

    default:
      return null;
  }
}

export default function ActivityPage() {
  const { activeWorkspace } = useWorkspace();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  // userId → name lookup map
  const [userMap, setUserMap] = useState(new Map());

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);

    // Load both activities and members in parallel
    Promise.all([
      listActivities(activeWorkspace.id),
      listMembers(activeWorkspace.id),
    ])
      .then(([actData, membersData]) => {
        // Activities: API returns { data, total, page, pageSize }
        setActivities(Array.isArray(actData) ? actData : actData.data || []);

        // Build userId → name map from workspace members
        const map = new Map();
        const members = Array.isArray(membersData) ? membersData : [];
        for (const m of members) {
          const userId = m.userId || m.user?.id;
          const name = m.user?.name || m.user?.email || userId;
          if (userId) map.set(userId, name);
        }
        setUserMap(map);
      })
      .catch(() => {
        setActivities([]);
        setUserMap(new Map());
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return <div className="empty-state"><h3>No workspace selected</h3></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>📜 Activity Log</h2>
          <div className="page-header-sub">in {activeWorkspace.name} • {activities.length} events</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state glass-card">
          <h3>No activity yet</h3>
          <p>Actions like creating tasks, adding comments, etc. will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map((a, idx) => {
            const config = TYPE_CONFIG[a.type] || { icon: '⚪', label: a.type };
            const detail = renderPayloadDetail(a.type, a.payload, userMap);

            return (
              <div
                key={a.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animationDelay: `${idx * 0.025}s`,
                }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{config.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem' }}>
                    <strong>{config.label}</strong>
                    {detail && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.84rem' }}>
                        — {detail}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(a.createdAt).toLocaleString()}
                    {a.actor?.name ? ` • by ${a.actor.name}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
