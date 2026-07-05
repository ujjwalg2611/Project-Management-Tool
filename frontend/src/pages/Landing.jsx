import React from 'react';
import { Link } from 'react-router-dom';

const TIERS = [
  { name: 'Free', code: '01', price: '$0', features: ['Up to 3 projects', 'Unlimited tasks', 'Basic board view'] },
  { name: 'Pro', code: '02', price: '$9', unit: '/user/mo', features: ['Unlimited projects', 'Timeline & Gantt view', 'Automations', 'Priority support'], highlight: true },
  { name: 'Enterprise', code: '03', price: 'Custom', features: ['SSO & audit logs', 'Custom roles', 'Dedicated support'] },
];

const SAMPLE_CARDS = [
  { col: 'To Do', title: 'Design new homepage hero', stamp: 'High', stampClass: 'stamp-high', meta: 'Jul 08' },
  { col: 'To Do', title: 'Write onboarding copy', stamp: 'Std', stampClass: 'stamp-medium', meta: '2/3' },
  { col: 'In Progress', title: 'Set up staging environment', stamp: 'Rush', stampClass: 'stamp-urgent', meta: 'Jul 06' },
  { col: 'In Progress', title: 'API rate limiting', stamp: 'Std', stampClass: 'stamp-medium', meta: '1/4' },
  { col: 'Done', title: 'Migrate auth to JWT', stamp: 'Low', stampClass: 'stamp-low', meta: 'Jul 02' },
];

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--line)' }}>
        <div className="sidebar-logo" style={{ padding: 0 }}><span className="dot" />ProjectFlow</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link className="btn btn-outline" to="/login">Log in</Link>
          <Link className="btn btn-primary" to="/register">Get started free</Link>
        </div>
      </header>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '90px 24px 40px', display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amber)', fontWeight: 600 }}>
          Manifest No. 001 — Now shipping
        </div>
        <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: 0, maxWidth: 720 }}>
          Every task, tracked<br />like it matters.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-dim)', maxWidth: 480, margin: 0 }}>
          Boards, timelines, and docs in one workspace. No task falls through —
          everything gets a status, an owner, and a stamp.
        </p>
        <div>
          <Link className="btn btn-primary" to="/register" style={{ padding: '12px 22px', fontSize: 15 }}>
            Get started free →
          </Link>
        </div>

        {/* Signature: a live-look manifest board, cards styled exactly like the real app */}
        <div className="card" style={{ marginTop: 32, padding: '18px 18px 6px', background: 'var(--paper)' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {['To Do', 'In Progress', 'Done'].map((col, i) => (
              <div key={col} className="board-column" style={{ flex: 1, background: 'transparent' }}>
                <div className="board-column-header">
                  <span className="col-name">{col}</span>
                  <span className="col-count">0{SAMPLE_CARDS.filter((c) => c.col === col).length}</span>
                </div>
                {SAMPLE_CARDS.filter((c) => c.col === col).map((c, j) => (
                  <div key={c.title} className="task-card" style={{ animation: `float 4s ease-in-out ${(i + j) * 0.35}s infinite` }}>
                    <div className="task-card-top">
                      <div className="task-card-title">{c.title}</div>
                      <span className={`stamp ${c.stampClass}`}>{c.stamp}</span>
                    </div>
                    <div className="task-meta"><span>{c.meta}</span></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: '70px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
        {[
          { code: '01', title: 'Boards', desc: 'Drag-and-drop Kanban that fits any workflow, with WIP limits when you need them.' },
          { code: '02', title: 'Timeline', desc: 'Visualize dependencies and deadlines on a Gantt view before they become surprises.' },
          { code: '03', title: 'Team', desc: 'Assign work, mention teammates, and see who is looking at what — live.' },
          { code: '04', title: 'Automations', desc: 'When a task moves to Done, hand it off automatically. No manual relay.' },
        ].map((f) => (
          <div key={f.title} style={{ padding: 24, background: 'var(--surface)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)', marginBottom: 10 }}>{f.code}</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>{f.title}</h3>
            <p style={{ color: 'var(--ink-dim)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      <section style={{ maxWidth: 940, margin: '0 auto 90px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Simple pricing</h2>
        <p style={{ textAlign: 'center', color: 'var(--ink-dim)', marginTop: 0, marginBottom: 36 }}>Start free. Upgrade when the team grows.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 18 }}>
          {TIERS.map((t) => (
            <div key={t.name} className="card" style={{ padding: 26, border: t.highlight ? '1.5px solid var(--cobalt)' : undefined, position: 'relative' }}>
              {t.highlight && (
                <span style={{ position: 'absolute', top: -10, left: 24, background: 'var(--cobalt)', color: 'white', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 2, letterSpacing: '0.04em' }}>
                  MOST COMMON
                </span>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{t.code}</div>
              <h3 style={{ margin: '8px 0 4px' }}>{t.name}</h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, margin: '10px 0' }}>
                {t.price}<span style={{ fontSize: 14, color: 'var(--ink-dim)', fontWeight: 400 }}>{t.unit || ''}</span>
              </div>
              <ul style={{ paddingLeft: 18, color: 'var(--ink-dim)', fontSize: 13.5, lineHeight: 1.9 }}>
                {t.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg);} 50% { transform: translateY(-3px) rotate(-0.3deg);} }
        @media (prefers-reduced-motion: reduce) { .task-card { animation: none !important; } }
      `}</style>
    </div>
  );
}
