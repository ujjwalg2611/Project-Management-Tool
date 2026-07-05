import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, padding: 32 }}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
        <input className="input" type="email" required style={{ margin: '6px 0 14px' }}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
        <input className="input" type="password" required style={{ margin: '6px 0 20px' }}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p style={{ fontSize: 13, textAlign: 'center', marginTop: 16, color: 'var(--text-dim)' }}>
          No account? <Link to="/register">Sign up</Link>
        </p>
        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-dim)' }}>
          Demo: demo@example.com / password123 (after running <code>npm run seed</code>)
        </p>
      </form>
    </div>
  );
}
