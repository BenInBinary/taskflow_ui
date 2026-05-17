// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { listProjects, createProject, removeProject } from '../api/projects';
import { listTasks } from '../api/tasks';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskCounts, setTaskCounts] = useState({});

  // Track which project card is showing the inline delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadProjects() {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await listProjects(activeWorkspace.id);
      setProjects(data);

      const counts = {};
      for (const proj of data) {
        try {
          const result = await listTasks(activeWorkspace.id, proj.id, { pageSize: 1 });
          counts[proj.id] = result.total ?? (Array.isArray(result) ? result.length : 0);
        } catch {
          counts[proj.id] = 0;
        }
      }
      setTaskCounts(counts);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [activeWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject(activeWorkspace.id, name, description);
      toast.success('Project created!');
      setShowCreate(false);
      setName('');
      setDescription('');
      loadProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId) {
    try {
      await removeProject(activeWorkspace.id, projectId);
      toast.success('Project deleted');
      setConfirmDeleteId(null);
      loadProjects();
    } catch (err) {
      toast.error(err.message ?? 'Failed to delete project');
    }
  }

  function handleProjectClick(proj) {
    navigate(`/tasks?projectId=${proj.id}`);
  }

  if (!activeWorkspace) {
    return (
      <div className="empty-state">
        <h3>No workspace selected</h3>
        <p>Select or create a workspace from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <div className="page-header-sub">
            in {activeWorkspace.name} • {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state glass-card">
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj, idx) => (
            <div
              key={proj.id}
              className="project-card glass-card animate-fade-in"
              style={{ animationDelay: `${idx * 0.04}s` }}
              onClick={() => {
                // Don't navigate if the delete confirm is open on this card
                if (confirmDeleteId !== proj.id) handleProjectClick(proj);
              }}
            >
              <h3>📁 {proj.name}</h3>
              <p>{proj.description || 'No description'}</p>
              <div className="project-card-footer">
                <div>
                  <span className="project-card-date">
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                  {taskCounts[proj.id] !== undefined && (
                    <span style={{ marginLeft: 10, fontSize: '0.75rem', color: 'var(--accent-light)' }}>
                      {taskCounts[proj.id]} task{taskCounts[proj.id] !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="project-card-actions">
                  {confirmDeleteId === proj.id ? (
                    // ── Inline confirmation ──────────────────────────────
                    <>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-danger, #e55)' }}>
                        Delete project?
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => { e.stopPropagation(); handleDelete(proj.id); }}
                      >
                        Yes, delete
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    // ── Normal actions ───────────────────────────────────
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={e => { e.stopPropagation(); handleProjectClick(proj); }}
                      >
                        View Tasks
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(proj.id); }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Project Name</label>
              <input
                className="input"
                placeholder="e.g. Q4 Launch"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="Brief project description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
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