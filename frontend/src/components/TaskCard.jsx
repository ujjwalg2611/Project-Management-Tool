import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import Avatar from './Avatar';
import { PRIORITY_STAMP, isOverdue } from '../utils';

export default function TaskCard({ task, index, project, onClick }) {
  const overdue = isOverdue(task.dueDate) && !task.isCompleted;
  const doneSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
          style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(1.5deg)` : provided.draggableProps.style?.transform }}
          onClick={() => onClick(task._id)}
        >
          <div className="task-card-top">
            <div className="task-card-title">{task.title}</div>
            <span className={`stamp stamp-${task.priority}`}>{PRIORITY_STAMP[task.priority]}</span>
          </div>

          {task.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 9 }}>
              {task.tags.map((tagId) => {
                const tag = project?.tags?.find((t) => t._id === tagId);
                if (!tag) return null;
                return <span key={tagId} className="tag-chip" style={{ background: tag.color + '1f', color: tag.color }}>{tag.name}</span>;
              })}
            </div>
          )}

          <div className="task-card-footer">
            <div className="task-meta">
              {task.dueDate && (
                <span className={overdue ? 'overdue' : ''}>
                  {overdue ? '! ' : ''}{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
                </span>
              )}
              {task.subtasks?.length > 0 && <span>{doneSubtasks}/{task.subtasks.length}</span>}
              {task.attachments?.length > 0 && <span>{task.attachments.length}f</span>}
            </div>
            <div className="avatar-stack">
              {task.assignees?.slice(0, 3).map((a) => <Avatar key={a._id} user={a} size={22} />)}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
