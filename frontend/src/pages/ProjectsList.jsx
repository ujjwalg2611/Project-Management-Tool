import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api/client';
import CreateProjectModal from '../components/CreateProjectModal.jsx';

export default function ProjectsList() {
  const { workspace } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  function load() {
    if (!workspace) return;
    api.get('/projects', { params: { workspaceId: workspace._id, archived: showArchived } }).then((res) => setProjects(res.data));
  }

  useEffect(load, [workspace, showArchived]);

  async function toggleStar(e, id) {
    e.preventDefault();
    await api.post(`/projects/${id}/star`);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Show active' : 'Show archived'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New project</button>
        </div>
      </div>

      <div className="project-grid">
        {projects.map((p) => (
          <Link key={p._id} to={`/app/projects/${p._id}`} className="card project-card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative', '--project-color': p.color }}>
            <button onClick={(e) => toggleStar(e, p._id)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 15 }}>
              {p.isStarred ? '⭐' : '☆'}
            </button>
            <div style={{ fontSize: 24 }}>{p.icon}</div>
            <div style={{ fontWeight: 600, margin: '8px 0 2px' }}>{p.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', minHeight: 18 }}>{p.description}</div>
            <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${p.progress}%` }} /></div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>{p.progress}% complete · {p.taskCount} tasks</div>
          </Link>
        ))}
        {projects.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No projects yet — create your first one.</p>}
      </div>

      {showCreate && (
        <CreateProjectModal
          workspaceId={workspace._id}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
