import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import Avatar from '../components/Avatar.jsx';

export default function Team() {
  const { workspace } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  function load() {
    if (!workspace) return;
    api.get(`/workspaces/${workspace._id}/members`).then((res) => setMembers(res.data));
    api.get(`/workspaces/${workspace._id}/invites`).then((res) => setInvites(res.data)).catch(() => setInvites([]));
  }

  useEffect(load, [workspace]);

  async function sendInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspace._id}/invites`, { email, role });
      setEmail('');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(userId, newRole) {
    await api.patch(`/workspaces/${workspace._id}/members/${userId}`, { role: newRole });
    load();
  }

  async function removeMember(userId) {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/workspaces/${workspace._id}/members/${userId}`);
    load();
  }

  async function revokeInvite(id) {
    await api.delete(`/workspaces/${workspace._id}/invites/${id}`);
    load();
  }

  async function resendInvite(id) {
    await api.post(`/workspaces/${workspace._id}/invites/${id}/resend`);
    alert('Invite resent');
  }

  if (!workspace) return null;

  return (
    <div>
      <h1>Members</h1>

      <form onSubmit={sendInvite} className="card" style={{ padding: 16, display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <input className="input" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} />
        <select className="input" style={{ width: 140 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <button className="btn btn-primary" disabled={inviting}>{inviting ? 'Sending…' : 'Invite'}</button>
      </form>

      <table className="list-view" style={{ marginBottom: 24 }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th /></tr></thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.user._id}>
              <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar user={m.user} size={24} />{m.user.name}</td>
              <td>{m.user.email}</td>
              <td>
                <select className="input" style={{ width: 110 }} value={m.role} onChange={(e) => changeRole(m.user._id, e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td>{new Date(m.joinedAt || m.user.createdAt).toLocaleDateString()}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => removeMember(m.user._id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {invites.length > 0 && (
        <>
          <h3>Pending invites</h3>
          <table className="list-view">
            <thead><tr><th>Email</th><th>Role</th><th>Expires</th><th /></tr></thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => resendInvite(inv._id)}>Resend</button>
                    <button className="btn btn-sm btn-danger" onClick={() => revokeInvite(inv._id)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
