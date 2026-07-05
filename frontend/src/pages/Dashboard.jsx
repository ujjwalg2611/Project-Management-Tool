import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { PRIORITY_LABEL, isOverdue } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { workspace } = useOutletContext();
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/tasks/mine', { params: { filter: 'assigned' } }).then((res) => setMyTasks(res.data));
  }, []);

  useEffect(() => {
    if (workspace) api.get('/projects', { params: { workspaceId: workspace._id } }).then((res) => setProjects(res.data.slice(0, 4)));
  }, [workspace]);

  const dueToday = myTasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>{greeting}, {user.name.split(' ')[0]} 👋</h1>
      <p style={{ color: 'var(--text-dim)', marginTop: 0 }}>Here's what's happening across your workspace.</p>

      <section style={{ marginTop: 28 }}>
        <h3>Due today ({dueToday.length})</h3>
        {dueToday.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nothing due today — nice work.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dueToday.map((t) => (
            <Link key={t._id} to={`/app/projects/${t.project._id}`} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}>
              <span>{t.title}</span>
              <span className={`badge badge-priority-${t.priority}`}>{PRIORITY_LABEL[t.priority]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recent projects</h3>
          <Link to="/app/projects" style={{ fontSize: 13, color: 'var(--accent)' }}>View all →</Link>
        </div>
        <div className="project-grid">
          {projects.map((p) => (
            <Link key={p._id} to={`/app/projects/${p._id}`} className="card project-card" style={{ textDecoration: 'none', color: 'inherit', '--project-color': p.color }}>
              <div style={{ fontSize: 22 }}>{p.icon}</div>
              <div style={{ fontWeight: 600, margin: '8px 0 2px' }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{p.taskCount} tasks</div>
              <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${p.progress}%` }} /></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
