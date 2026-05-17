// ──────────────────────────────────────────────
// src/components/Sidebar.jsx
// ──────────────────────────────────────────────

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../context/SocketContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { unreadCount } = useSocket();

  function handleWorkspaceChange(e) {
    const ws = workspaces.find(w => w.id === e.target.value);
    if (ws) setActiveWorkspace(ws);
  }

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h1>
          <span className="logo-icon">⚡</span>
          TaskFlow
        </h1>
      </div>

      {/* Workspace Switcher */}
      <div className="workspace-switcher">
        <div className="workspace-switcher-label">Workspace</div>
        <select
          value={activeWorkspace?.id || ''}
          onChange={handleWorkspaceChange}
        >
          {workspaces.length === 0 && <option value="">No workspaces</option>}
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📁</span> Projects
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">✅</span> Tasks
        </NavLink>

        <div className="nav-section-label" style={{ marginTop: 12 }}>Manage</div>
        <NavLink to="/members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span> Members
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔔</span> Notifications
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>
        <NavLink to="/activity" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📜</span> Activity Log
        </NavLink>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Log out">
          🚪
        </button>
      </div>
    </aside>
  );
}
