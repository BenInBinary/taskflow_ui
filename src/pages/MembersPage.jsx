// src/pages/MembersPage.jsx
import { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { listMembers, addMember, updateMemberRole, removeMember } from '../api/workspaces';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER'];

export default function MembersPage() {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track which member row is showing the inline remove confirmation
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // Add member modal
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);

  async function loadMembers() {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await listMembers(activeWorkspace.id);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, [activeWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    try {
      await addMember(activeWorkspace.id, email, role);
      toast.success('Member added!');
      setShowAdd(false);
      setEmail('');
      setRole('MEMBER');
      loadMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      await updateMemberRole(activeWorkspace.id, memberId, newRole);
      toast.success('Role updated');
      loadMembers();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRemove(memberId) {
    try {
      await removeMember(activeWorkspace.id, memberId);
      toast.success('Member removed');
      setConfirmRemoveId(null);
      loadMembers();
    } catch (err) {
      toast.error(err.message ?? 'Failed to remove member');
    }
  }

  if (!activeWorkspace) {
    return <div className="empty-state"><h3>No workspace selected</h3></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Members</h2>
          <div className="page-header-sub">in {activeWorkspace.name}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Invite Member
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state glass-card">
          <h3>No members yet</h3>
          <p>Invite team members to collaborate.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m, idx) => (
            <div
              key={m.id}
              className="glass-card animate-fade-in"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animationDelay: `${idx * 0.04}s`,
              }}
            >
              {/* Left: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600, color: '#fff',
                }}>
                  {(m.user?.name || m.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.user?.name || m.email}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.user?.email || ''}</div>
                </div>
              </div>

              {/* Right: role selector + remove / confirm */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: 100, padding: '6px 10px', fontSize: '0.82rem' }}
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                {confirmRemoveId === m.id ? (
                  // ── Inline confirmation ──────────────────────────
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-danger, #e55)', whiteSpace: 'nowrap' }}>
                      Remove member?
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(m.id)}
                    >
                      Yes
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmRemoveId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  // ── Normal remove button ─────────────────────────
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setConfirmRemoveId(m.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <Modal title="Invite Member" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="newbie@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.filter(r => r !== 'OWNER').map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}