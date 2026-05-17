// ──────────────────────────────────────────────
// src/pages/DashboardPage.jsx
// ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { createWorkspace } from '../api/workspaces';
import { listProjects } from '../api/projects';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeWorkspace, workspaces, refresh } = useWorkspace();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Load projects for the active workspace
  useEffect(() => {
    if (activeWorkspace) {
      listProjects(activeWorkspace.id)
        .then(setProjects)
        .catch(() => setProjects([]));
    }
  }, [activeWorkspace]);

  async function handleCreateWorkspace(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const newWs = await createWorkspace(wsName, wsDesc);
      toast.success('Workspace created!');
      setShowCreateWs(false);
      setWsName('');
      setWsDesc('');
      refresh(newWs.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="page-header-sub">
            Welcome back, {user?.name} 👋
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateWs(true)}>
          + New Workspace
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-card animate-fade-in">
          <span className="stat-icon">📂</span>
          <span className="stat-value">{workspaces.length}</span>
          <span className="stat-label">Workspaces</span>
        </div>
        <div className="stat-card glass-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <span className="stat-icon">📁</span>
          <span className="stat-value">{projects.length}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-card glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="stat-icon">⚡</span>
          <span className="stat-value">{activeWorkspace ? '✓' : '—'}</span>
          <span className="stat-label">Active Workspace</span>
        </div>
      </div>

      {/* Current workspace info */}
      {activeWorkspace ? (
        <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8 }}>📂 {activeWorkspace.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {activeWorkspace.description || 'No description'}
          </p>
          <div className="quick-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
              View Projects
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/members')}>
              Manage Members
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/activity')}>
              Activity Log
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state glass-card">
          <h3>No workspace selected</h3>
          <p>Create a workspace to get started with TaskFlow.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => setShowCreateWs(true)}
          >
            + Create Workspace
          </button>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateWs && (
        <Modal title="Create Workspace" onClose={() => setShowCreateWs(false)}>
          <form onSubmit={handleCreateWorkspace}>
            <div className="form-group">
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="e.g. Acme Engineering"
                value={wsName}
                onChange={e => setWsName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="What's this workspace for?"
                value={wsDesc}
                onChange={e => setWsDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateWs(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
