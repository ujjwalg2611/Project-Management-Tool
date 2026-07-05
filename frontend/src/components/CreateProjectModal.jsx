import React, { useState } from 'react';
import api from '../api/client';

const TEMPLATES = [
  { key: 'blank', label: 'Blank', icon: '📋' },
  { key: 'sprint_board', label: 'Sprint Board', icon: '🏃' },
  { key: 'bug_tracker', label: 'Bug Tracker', icon: '🐛' },
  { key: 'content_calendar', label: 'Content Calendar', icon: '📅' },
];

const COLORS = ['#2547FF', '#D6432F', '#3D7A5C', '#FF7A1A', '#5B6472', '#8A4FBF'];

export default function CreateProjectModal({ workspaceId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [template, setTemplate] = useState('blank');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/projects', { workspaceId, name, description, color, template });
      onCreated(res.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Create project</h3>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Name</label>
        <input className="input" style={{ margin: '6px 0 14px' }} value={name} onChange={(e) => setName(e.target.value)} autoFocus />

        <label style={{ fontSize: 13, fontWeight: 600 }}>Description</label>
        <textarea className="input" rows={2} style={{ margin: '6px 0 14px', resize: 'vertical' }}
          value={description} onChange={(e) => setDescription(e.target.value)} />

        <label style={{ fontSize: 13, fontWeight: 600 }}>Color</label>
        <div style={{ display: 'flex', gap: 8, margin: '8px 0 14px' }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: color === c ? '2px solid #000' : '2px solid transparent' }} />
          ))}
        </div>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Template</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0 20px' }}>
          {TEMPLATES.map((t) => (
            <button key={t.key} onClick={() => setTemplate(t.key)}
              className="card" style={{ padding: 12, textAlign: 'left', border: template === t.key ? '2px solid var(--accent)' : undefined }}>
              <div>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  );
}
