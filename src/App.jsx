// ──────────────────────────────────────────────
// src/App.jsx  —  Root component & routing
// ──────────────────────────────────────────────
// Route map:
//   /login          → LoginPage
//   /register       → RegisterPage
//   /dashboard      → DashboardPage       (protected)
//   /projects       → ProjectsPage        (protected)
//   /tasks          → TasksPage           (protected)
//   /members        → MembersPage         (protected)
//   /notifications  → NotificationsPage   (protected)
//   /activity       → ActivityPage        (protected)
// ──────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MembersPage from './pages/MembersPage';
import NotificationsPage from './pages/NotificationsPage';
import ActivityPage from './pages/ActivityPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
        <SocketProvider>

          {/* Toast notifications — positioned top-right */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1c1f2e',
                color: '#e8eaed',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '0.88rem',
              },
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — wrapped in Layout (sidebar) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

        </SocketProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
