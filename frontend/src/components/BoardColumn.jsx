import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard.jsx';

export default function BoardColumn({ column, tasks, project, onOpenTask, onAddTask }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  async function submit() {
    if (!title.trim()) { setAdding(false); return; }
    await onAddTask(column._id, title.trim());
    setTitle('');
    setAdding(false);
  }

  const overWip = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div className="board-column">
      <div className="board-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
          <span className="col-name">{column.name}</span>
        </div>
        <span className={`col-count${overWip ? ' over-wip' : ''}`}>
          {String(tasks.length).padStart(2, '0')}{column.wipLimit ? `/${column.wipLimit}` : ''}
        </span>
      </div>

      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ minHeight: 40, background: snapshot.isDraggingOver ? 'var(--cobalt-dim)' : 'transparent', borderRadius: 3, transition: 'background 0.15s' }}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} project={project} onClick={onOpenTask} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {adding ? (
        <div style={{ marginTop: 4 }}>
          <input
            className="input" autoFocus placeholder="Task title…"
            value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
            onBlur={submit}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--ink-dim)', padding: '9px 6px 4px', fontSize: 12.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
          + add task
        </button>
      )}
    </div>
  );
}
