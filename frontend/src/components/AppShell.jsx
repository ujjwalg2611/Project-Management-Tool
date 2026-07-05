import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';
import api from '../api/client';

const NAV_ITEMS = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/my-tasks', label: 'My Tasks', icon: '✅' },
  { to: '/app/inbox', label: 'Inbox', icon: '🔔' },
  { to: '/app/projects', label: 'Projects', icon: '📁' },
  { to: '/app/team', label: 'Members', icon: '👥' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    api.get('/workspaces').then((res) => setWorkspace(res.data[0]));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo"><span className="dot" />ProjectFlow</div>
        <div style={{ padding: '2px 8px 18px', fontSize: 11.5, color: 'var(--ink-dim)', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {workspace?.name || 'Loading…'}
        </div>
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <span>{item.icon}</span> {item.label}
              {item.to === '/app/inbox' && unread > 0 && (
                <span className="nav-counter">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar user={user} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <button className="btn btn-sm btn-outline" style={{ marginTop: 8 }} onClick={() => { logout(); navigate('/'); }}>
          Log out
        </button>
      </aside>
      <main className="main-content">
        <Outlet context={{ workspace }} />
      </main>
    </div>
  );
}
