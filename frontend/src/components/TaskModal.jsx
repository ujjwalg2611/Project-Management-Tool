import React, { useEffect, useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';
import { PRIORITY_LABEL } from '../utils';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

export default function TaskModal({ taskId, project, members, onClose, onChanged }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    api.get(`/tasks/${taskId}`).then((res) => { setTask(res.data); setTitle(res.data.title); setDescription(res.data.description || ''); });
    api.get('/comments', { params: { taskId } }).then((res) => setComments(res.data));
  }

  useEffect(load, [taskId]);

  async function patch(fields) {
    const res = await api.patch(`/tasks/${taskId}`, fields);
    setTask(res.data);
    onChanged?.();
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return;
    await api.post(`/tasks/${taskId}/subtasks`, { title: newSubtask.trim() });
    setNewSubtask('');
    load();
  }

  async function toggleSubtask(sub) {
    await api.patch(`/tasks/${taskId}/subtasks/${sub._id}`, { isCompleted: !sub.isCompleted });
    load();
  }

  async function deleteSubtask(sub) {
    await api.delete(`/tasks/${taskId}/subtasks/${sub._id}`);
    load();
  }

  async function toggleAssignee(userId) {
    const current = task.assignees.map((a) => a._id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    await patch({ assignees: next });
  }

  async function postComment() {
    if (!newComment.trim()) return;
    const mentioned = members.filter((m) => newComment.includes(`@${m.name}`)).map((m) => m._id);
    await api.post('/comments', { taskId, content: newComment, mentionedUserIds: mentioned });
    setNewComment('');
    load();
  }

  async function handleDuplicate() {
    await api.post(`/tasks/${taskId}/duplicate`);
    onChanged?.();
    onClose();
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    onChanged?.();
    onClose();
  }

  if (!task) return null;

  const doneCount = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 720, maxHeight: '85vh', overflowY: 'auto', padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <input
            className="input" style={{ fontSize: 20, fontWeight: 600, border: 'none', padding: '4px 0' }}
            value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== task.title && patch({ title })}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-outline" onClick={handleDuplicate}>Duplicate</button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
            <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Description</label>
            <textarea
              className="input" rows={4} style={{ margin: '6px 0 20px', resize: 'vertical' }}
              placeholder="Add a description… (supports @mentions in comments below)"
              value={description} onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== task.description && patch({ description })}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Subtasks {task.subtasks.length > 0 && `(${doneCount}/${task.subtasks.length})`}
            </label>
            <div style={{ margin: '8px 0 8px' }}>
              {task.subtasks.map((s) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <input type="checkbox" checked={s.isCompleted} onChange={() => toggleSubtask(s)} />
                  <span style={{ flex: 1, textDecoration: s.isCompleted ? 'line-through' : 'none', color: s.isCompleted ? 'var(--text-dim)' : 'inherit', fontSize: 14 }}>{s.title}</span>
                  <button onClick={() => deleteSubtask(s)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)' }}>✕</button>
                </div>
              ))}
            </div>
            <input
              className="input" placeholder="+ Add subtask" value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginTop: 24 }}>Comments</label>
            <div style={{ margin: '10px 0' }}>
              {comments.map((c) => (
                <div key={c._id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Avatar user={c.user} size={26} />
                  <div>
                    <div style={{ fontSize: 13 }}><strong>{c.user.name}</strong> <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</span></div>
                    <div style={{ fontSize: 14 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              className="input" rows={2} placeholder="Write a comment… use @Name to mention"
              value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginTop: 24 }}>Activity</label>
            <div style={{ marginTop: 8 }}>
              {task.activity.slice().reverse().map((a, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--text-dim)', padding: '3px 0' }}>
                  <strong style={{ color: 'var(--text)' }}>{a.actor?.name || 'Someone'}</strong>{' '}
                  {a.type === 'status_change' && `changed status from ${a.meta.from} → ${a.meta.to}`}
                  {a.type === 'created' && 'created this task'}
                  {a.type === 'comment' && 'commented'}
                  {' · '}{new Date(a.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</label>
            <select className="input" style={{ margin: '6px 0 16px' }} value={task.column} onChange={(e) => patch({ column: e.target.value })}>
              {project.columns.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Priority</label>
            <select className="input" style={{ margin: '6px 0 16px' }} value={task.priority} onChange={(e) => patch({ priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Due date</label>
            <input
              type="date" className="input" style={{ margin: '6px 0 16px' }}
              value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assignees</label>
            <div style={{ margin: '8px 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m) => {
                const active = task.assignees.some((a) => a._id === m._id);
                return (
                  <button key={m._id} onClick={() => toggleAssignee(m._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: active ? 'var(--accent-dim)' : 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px' }}>
                    <Avatar user={m} size={22} />
                    <span style={{ fontSize: 13 }}>{m.name}</span>
                    {active && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tags</label>
            <div style={{ margin: '8px 0 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.tags.map((t) => {
                const active = task.tags.includes(t._id);
                return (
                  <button key={t._id} onClick={() => patch({ tags: active ? task.tags.filter((id) => id !== t._id) : [...task.tags, t._id] })}
                    className="tag-chip" style={{ background: active ? t.color : t.color + '22', color: active ? '#fff' : t.color, border: 'none' }}>
                    {t.name}
                  </button>
                );
              })}
            </div>

            <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={() => api.post(`/tasks/${taskId}/watch`).then(load)}>
              {task.watchers?.some((w) => w._id) ? '👁 Watching' : '👁 Watch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
