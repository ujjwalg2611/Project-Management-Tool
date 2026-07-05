import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectsList from './pages/ProjectsList.jsx';
import ProjectBoard from './pages/ProjectBoard.jsx';
import MyTasks from './pages/MyTasks.jsx';
import Team from './pages/Team.jsx';
import Inbox from './pages/Inbox.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <SocketProvider>{children}</SocketProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/accept-invite" element={<Register />} />

      <Route
        path="/app"
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/:projectId" element={<ProjectBoard />} />
        <Route path="team" element={<Team />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
