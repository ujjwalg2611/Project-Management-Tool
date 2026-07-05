import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { PRIORITY_LABEL } from '../utils';

function groupTasks(tasks) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7 = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const groups = { Today: [], Upcoming: [], Later: [], 'No Due Date': [] };
  for (const t of tasks) {
    if (!t.dueDate) { groups['No Due Date'].push(t); continue; }
    const d = new Date(t.dueDate);
    if (d < in7 && d.toDateString() === startOfToday.toDateString()) groups.Today.push(t);
    else if (d >= startOfToday && d < in7) groups.Upcoming.push(t);
    else groups.Later.push(t);
  }
  return groups;
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('assigned');

  useEffect(() => {
    api.get('/tasks/mine', { params: { filter } }).then((res) => setTasks(res.data));
  }, [filter]);

  async function markComplete(id) {
    await api.patch(`/tasks/${id}`, { isCompleted: true });
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  const groups = groupTasks(tasks);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Tasks</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['assigned', 'created'].map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
              {f === 'assigned' ? 'Assigned to me' : 'Created by me'}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(groups).map(([label, group]) => group.length > 0 && (
        <section key={label} style={{ marginTop: 24 }}>
          <h3>{label} ({group.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.map((t) => (
              <div key={t._id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" onChange={() => markComplete(t._id)} />
                <Link to={`/app/projects/${t.project._id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t.project.icon} {t.project.name}</div>
                </Link>
                <span className={`badge badge-priority-${t.priority}`}>{PRIORITY_LABEL[t.priority]}</span>
                {t.dueDate && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(t.dueDate).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
