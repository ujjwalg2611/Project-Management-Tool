import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar.jsx';

const TYPE_LABEL = {
  task_assigned: 'assigned you a task',
  mention: 'mentioned you',
  due_soon: 'task is due soon',
  status_changed: 'changed task status',
  comment_added: 'commented',
};

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const { setNotifications: setLiveNotifications } = useSocket() || {};
  const navigate = useNavigate();

  function load() {
    api.get('/notifications').then((res) => setNotifications(res.data));
  }
  useEffect(load, []);

  async function markRead(n) {
    await api.patch(`/notifications/${n._id}/read`);
    setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    if (n.task) navigate(`/app/projects/${n.project}`);
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLiveNotifications?.([]);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Inbox</h1>
        <button className="btn btn-outline" onClick={markAllRead}>Mark all as read</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notifications.map((n) => (
          <button key={n._id} onClick={() => markRead(n)} className="card"
            style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: 'none', background: n.read ? 'var(--surface)' : 'var(--accent-dim)' }}>
            <Avatar user={n.actor} size={26} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14 }}><strong>{n.actor?.name || 'Someone'}</strong> {TYPE_LABEL[n.type]} {n.task ? `"${n.task.title}"` : ''}</span>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
          </button>
        ))}
        {notifications.length === 0 && <p style={{ color: 'var(--text-dim)' }}>You're all caught up.</p>}
      </div>
    </div>
  );
}
