import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get('token');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, inviteToken: inviteToken || undefined });
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, padding: 32 }}>
        <h2 style={{ marginTop: 0 }}>{inviteToken ? 'Accept invite' : 'Create your account'}</h2>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <label style={{ fontSize: 13, fontWeight: 600 }}>Name</label>
        <input className="input" required style={{ margin: '6px 0 14px' }}
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
        <input className="input" type="email" required style={{ margin: '6px 0 14px' }}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
        <input className="input" type="password" required minLength={8} style={{ margin: '6px 0 20px' }}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Creating account…' : 'Get Started Free'}
        </button>
        <p style={{ fontSize: 13, textAlign: 'center', marginTop: 16, color: 'var(--text-dim)' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
