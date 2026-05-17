// ──────────────────────────────────────────────
// src/components/ProtectedRoute.jsx
// ──────────────────────────────────────────────
// Redirects unauthenticated users to /login.
// ──────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-muted)',
        fontSize: '1rem',
      }}>
        Loading...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
