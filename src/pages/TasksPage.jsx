// src/pages/TasksPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { listProjects } from '../api/projects';
import { listTasks, createTask, updateTask, removeTask, getSubtree } from '../api/tasks';
import { listComments, createComment } from '../api/comments';
import { listMembers } from '../api/workspaces';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import './TasksPage.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TasksPage() {
  const { activeWorkspace } = useWorkspace();

  // ─── Project selection ──────────────────
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // ─── Task list ──────────────────────────
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  // ─── Task detail ────────────────────────
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // ─── Inline delete confirmation ─────────
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState(null);

  // ─── Create task modal ──────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'TODO', priority: 'MEDIUM',
    dueAt: '', parentTaskId: '', assigneeId: '',
  });
  const [creating, setCreating] = useState(false);

  // ─── Subtasks ───────────────────────────
  const [subtasks, setSubtasks] = useState([]);

  // ─── Workspace members (for assignee picker) ──
  const [members, setMembers] = useState([]);

  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  // Load projects when workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    listProjects(activeWorkspace.id)
      .then(data => {
        setProjects(data);
        if (urlProjectId) {
          const target = data.find(p => p.id === urlProjectId);
          if (target) { setSelectedProject(target); return; }
        }
        if (data.length > 0) setSelectedProject(data[0]);
      })
      .catch(() => setProjects([]));

    listMembers(activeWorkspace.id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [activeWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tasks when project or filters change
  useEffect(() => {
    if (!activeWorkspace || !selectedProject) return;
    loadTasks();
  }, [activeWorkspace, selectedProject, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTasks() {
    setTasksLoading(true);
    try {
      const result = await listTasks(activeWorkspace.id, selectedProject.id, filters);
      setTasks(Array.isArray(result) ? result : result.data || []);
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  // Load comments + subtasks when a task is selected
  useEffect(() => {
    if (!selectedTask) return;
    listComments(activeWorkspace.id, selectedProject.id, selectedTask.id)
      .then(setComments)
      .catch(() => setComments([]));

    getSubtree(activeWorkspace.id, selectedProject.id, selectedTask.id)
      .then(tree => setSubtasks(tree.filter(t => t.depth > 0)))
      .catch(() => setSubtasks([]));
  }, [selectedTask]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───────────────────────────

  async function handleCreateTask(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const data = { ...taskForm };
      if (!data.dueAt) delete data.dueAt;
      if (!data.parentTaskId) delete data.parentTaskId;
      if (!data.assigneeId) delete data.assigneeId;
      await createTask(activeWorkspace.id, selectedProject.id, data);
      toast.success('Task created!');
      setShowCreate(false);
      setTaskForm({
        title: '', description: '', status: 'TODO', priority: 'MEDIUM',
        dueAt: '', parentTaskId: '', assigneeId: '',
      });
      loadTasks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(task, newStatus) {
    try {
      await updateTask(activeWorkspace.id, selectedProject.id, task.id, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      loadTasks();
      if (selectedTask?.id === task.id) {
        setSelectedTask(t => ({ ...t, status: newStatus }));
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await removeTask(activeWorkspace.id, selectedProject.id, taskId);
      toast.success('Task deleted');
      if (selectedTask?.id === taskId) setSelectedTask(null);
      setConfirmDeleteTaskId(null);
      loadTasks();
    } catch (err) {
      toast.error(err.message ?? 'Failed to delete task');
      setConfirmDeleteTaskId(null);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await createComment(
        activeWorkspace.id,
        selectedProject.id,
        selectedTask.id,
        newComment,
      );
      setNewComment('');
      const updated = await listComments(
        activeWorkspace.id,
        selectedProject.id,
        selectedTask.id,
      );
      setComments(updated);
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ─── Badge helpers ──────────────────────

  function statusBadgeClass(status) {
    const map = {
      TODO: 'badge-todo',
      IN_PROGRESS: 'badge-in-progress',
      IN_REVIEW: 'badge-in-review',
      DONE: 'badge-done',
      CANCELLED: 'badge-cancelled',
    };
    return `badge ${map[status] || ''}`;
  }

  function priorityBadgeClass(priority) {
    const map = {
      LOW: 'badge-low',
      MEDIUM: 'badge-medium',
      HIGH: 'badge-high',
      URGENT: 'badge-urgent',
    };
    return `badge ${map[priority] || ''}`;
  }

  function isOverdue(dueAt) {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  // ─── Render ─────────────────────────────

  if (!activeWorkspace) {
    return <div className="empty-state"><h3>No workspace selected</h3></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Tasks</h2>
          <div className="page-header-sub">in {activeWorkspace.name}</div>
        </div>
        {selectedProject && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Task
          </button>
        )}
      </div>

      {/* Project chips */}
      {projects.length > 0 && (
        <div className="project-selector">
          {projects.map(p => (
            <button
              key={p.id}
              className={`project-chip ${selectedProject?.id === p.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedProject(p);
                setSelectedTask(null);
                setConfirmDeleteTaskId(null);
              }}
            >
              📁 {p.name}
            </button>
          ))}
        </div>
      )}

      {!selectedProject ? (
        <div className="empty-state glass-card">
          <h3>No project selected</h3>
          <p>Create a project first from the Projects page.</p>
        </div>
      ) : (
        <>
          {/* Filters toolbar */}
          <div className="tasks-toolbar">
            <input
              className="input search-input"
              placeholder="🔍 Search tasks..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
            <select
              className="input"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              className="input"
              value={filters.priority}
              onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Task list */}
          {tasksLoading ? (
            <div className="task-list">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 52, borderRadius: 'var(--radius-md)' }}
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state glass-card">
              <h3>No tasks found</h3>
              <p>Create a task or adjust your filters.</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="task-row glass-card animate-fade-in"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                  onClick={() => {
                    setSelectedTask(task);
                    setConfirmDeleteTaskId(null);
                  }}
                >
                  <span className="task-row-title">{task.title}</span>
                  <div className="task-row-meta">
                    {task.dueAt && (
                      <span className={`task-row-date ${isOverdue(task.dueAt) ? 'overdue' : ''}`}>
                        📅 {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className={priorityBadgeClass(task.priority)}>{task.priority}</span>
                    <span className={statusBadgeClass(task.status)}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task Detail Panel */}
          {selectedTask && (
            <div className="task-detail glass-card animate-fade-in">
              <h3>{selectedTask.title}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
                {selectedTask.description || 'No description'}
              </p>

              <div className="task-detail-grid">
                <div className="task-detail-field">
                  <span className="label">Status</span>
                  <select
                    className="input"
                    value={selectedTask.status}
                    onChange={e => handleStatusChange(selectedTask, e.target.value)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="task-detail-field">
                  <span className="label">Priority</span>
                  <span className={priorityBadgeClass(selectedTask.priority)}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="task-detail-field">
                  <span className="label">Due Date</span>
                  <input
                    className="input"
                    type="datetime-local"
                    value={selectedTask.dueAt
                      ? new Date(selectedTask.dueAt).toISOString().slice(0, 16)
                      : ''}
                    onChange={async e => {
                      const val = e.target.value || null;
                      try {
                        await updateTask(
                          activeWorkspace.id,
                          selectedProject.id,
                          selectedTask.id,
                          { dueAt: val },
                        );
                        setSelectedTask(t => ({ ...t, dueAt: val }));
                        toast.success(val ? 'Due date updated' : 'Due date cleared');
                        loadTasks();
                      } catch (err) {
                        toast.error(err.message);
                      }
                    }}
                  />
                </div>
                <div className="task-detail-field">
                  <span className="label">Assignee</span>
                  <select
                    className="input"
                    value={selectedTask.assigneeId || ''}
                    onChange={async e => {
                      const val = e.target.value || null;
                      try {
                        await updateTask(
                          activeWorkspace.id,
                          selectedProject.id,
                          selectedTask.id,
                          { assigneeId: val },
                        );
                        setSelectedTask(t => ({ ...t, assigneeId: val }));
                        toast.success(val ? 'Assignee updated' : 'Unassigned');
                        loadTasks();
                      } catch (err) {
                        toast.error(err.message);
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.userId || m.user?.id} value={m.userId || m.user?.id}>
                        {m.user?.name || m.user?.email || m.userId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Task actions with inline delete confirm ── */}
              <div className="task-detail-actions">
                {confirmDeleteTaskId === selectedTask.id ? (
                  <>
                    <span style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-danger, #e55)',
                      alignSelf: 'center',
                    }}>
                      Delete this task?
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                    >
                      Yes, delete
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmDeleteTaskId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmDeleteTaskId(selectedTask.id)}
                    >
                      Delete Task
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setTaskForm(f => ({
                          ...f,
                          parentTaskId: selectedTask.id,
                          title: '',
                          description: '',
                        }));
                        setShowCreate(true);
                      }}
                    >
                      + Add Subtask
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedTask(null)}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>

              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div className="comments-section">
                  <h4>🔗 Subtasks ({subtasks.length})</h4>
                  <div className="task-list" style={{ marginTop: 8 }}>
                    {subtasks.map(st => (
                      <div
                        key={st.id}
                        className="task-row glass-card animate-fade-in"
                        style={{ paddingLeft: 18 + st.depth * 20, cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedTask(st);
                          setConfirmDeleteTaskId(null);
                        }}
                      >
                        <span className="task-row-title" style={{ fontSize: '0.85rem' }}>
                          {'└'.repeat(st.depth)} {st.title}
                        </span>
                        <div className="task-row-meta">
                          <span className={priorityBadgeClass(st.priority)}>{st.priority}</span>
                          <span className={statusBadgeClass(st.status)}>
                            {st.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="comments-section">
                <h4>💬 Comments ({comments.length})</h4>
                {comments.map(c => (
                  <div key={c.id} className="comment-item animate-fade-in">
                    <div className="comment-item-header">
                      <span>{c.author?.name || 'User'}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="comment-item-body">{c.body}</div>
                  </div>
                ))}
                <form className="comment-form" onSubmit={handleAddComment}>
                  <input
                    className="input"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Send</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="e.g. Wire up auth flow"
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="input"
                placeholder="Details about this task..."
                value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label">Status</label>
                <select
                  className="input"
                  value={taskForm.status}
                  onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={taskForm.priority}
                  onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Due Date (optional)</label>
              <input
                className="input"
                type="datetime-local"
                value={taskForm.dueAt}
                onChange={e => setTaskForm(f => ({ ...f, dueAt: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Assign To (optional)</label>
              <select
                className="input"
                value={taskForm.assigneeId}
                onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId || m.user?.id} value={m.userId || m.user?.id}>
                    {m.user?.name || m.user?.email || m.userId}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Parent Task ID (for subtask, optional)</label>
              <input
                className="input"
                placeholder="UUID of parent task"
                value={taskForm.parentTaskId}
                onChange={e => setTaskForm(f => ({ ...f, parentTaskId: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}