// ──────────────────────────────────────────────
// src/context/WorkspaceContext.jsx
// ──────────────────────────────────────────────
// Provides: workspaces[], activeWorkspace, setActiveWorkspace, refresh()
// ──────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listMyWorkspaces } from '../api/workspaces';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  // refreshAfterCreate: optionally pass the new workspace to auto-select it
  const refresh = useCallback(async (autoSelectId) => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listMyWorkspaces();
      setWorkspaces(list);

      if (autoSelectId) {
        // Auto-select the workspace that was just created
        const created = list.find(w => w.id === autoSelectId);
        if (created) setActiveWorkspace(created);
      } else if (!activeWorkspace && list.length > 0) {
        // First load — select first workspace
        setActiveWorkspace(list[0]);
      } else if (activeWorkspace) {
        // Keep the current selection in sync (in case name changed)
        const current = list.find(w => w.id === activeWorkspace.id);
        if (current) setActiveWorkspace(current);
        else if (list.length > 0) setActiveWorkspace(list[0]);
        else setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeWorkspace]);

  useEffect(() => {
    refresh();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, loading, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be inside <WorkspaceProvider>');
  return ctx;
}
