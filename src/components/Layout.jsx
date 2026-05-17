// ──────────────────────────────────────────────
// src/components/Layout.jsx
// ──────────────────────────────────────────────
// Shell layout: fixed sidebar + scrollable main area.
// Used by all authenticated routes.
// ──────────────────────────────────────────────

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 260,
        flex: 1,
        padding: '28px 32px',
        overflowY: 'auto',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
