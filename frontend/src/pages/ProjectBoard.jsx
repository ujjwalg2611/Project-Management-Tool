import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import BoardColumn from '../components/BoardColumn.jsx';
import TaskModal from '../components/TaskModal.jsx';
import Avatar from '../components/Avatar.jsx';
import { PRIORITY_LABEL, isOverdue } from '../utils';

export default function ProjectBoard() {
  const { projectId } = useParams();
  const { socket } = useSocket() || {};
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [view, setView] = useState('board'); // 'board' | 'list'
  const [openTaskId, setOpenTaskId] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');

  function loadAll() {
    api.get(`/projects/${projectId}`).then((res) => setProject(res.data));
    api.get('/tasks', { params: { projectId } }).then((res) => setTasks(res.data));
  }

  useEffect(loadAll, [projectId]);

  useEffect(() => {
    if (!project) return;
    api.get(`/workspaces/${project.workspace}/members`).then((res) => setMembers(res.data.map((m) => m.user)));
  }, [project]);

  // Real-time sync
  useEffect(() => {
    if (!socket) return;
    socket.emit('project:join', projectId);

    const onUpdated = (task) => setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    const onCreated = (task) => setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]));
    const onDeleted = ({ taskId }) => setTasks((prev) => prev.filter((t) => t._id !== taskId));

    socket.on('task:updated', onUpdated);
    socket.on('task:created', onCreated);
    socket.on('task:deleted', onDeleted);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('task:updated', onUpdated);
      socket.off('task:created', onCreated);
      socket.off('task:deleted', onDeleted);
    };
  }, [socket, projectId]);

  const filteredTasks = useMemo(
    () => tasks.filter((t) => !filterAssignee || t.assignees.some((a) => a._id === filterAssignee)),
    [tasks, filterAssignee]
  );

  const columns = useMemo(() => [...(project?.columns || [])].sort((a, b) => a.order - b.order), [project]);

  function tasksForColumn(columnId) {
    return filteredTasks.filter((t) => t.column === columnId).sort((a, b) => a.order - b.order);
  }

  async function handleAddTask(columnId, title) {
    const res = await api.post('/tasks', { projectId, columnId, title });
    setTasks((prev) => [...prev, res.data]);
    socket?.emit('task:created', { projectId, task: res.data });
  }

  // Optimistic drag-and-drop: reorder within column or move across columns
  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destColumnTasks = tasksForColumn(destination.droppableId).filter((t) => t._id !== draggableId);
    destColumnTasks.splice(destination.index, 0, { _id: draggableId });
    const newOrder = destination.index;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, column: destination.droppableId, order: newOrder } : t))
    );

    try {
      const res = await api.patch(`/tasks/${draggableId}`, { column: destination.droppableId, order: newOrder });
      socket?.emit('task:moved', { projectId, task: res.data });
    } catch {
      loadAll(); // revert on failure
    }
  }

  if (!project) return <div className="center-loader">Loading board…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>{project.icon} {project.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${view === 'board' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('board')}>Board</button>
          <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('list')}>List</button>
        </div>
      </div>
      <p style={{ color: 'var(--text-dim)', marginTop: 0 }}>{project.description}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Filter by assignee:</span>
        <select className="input" style={{ width: 180 }} value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">Everyone</option>
          {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
      </div>

      {view === 'board' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {columns.map((col) => (
              <BoardColumn
                key={col._id}
                column={col}
                tasks={tasksForColumn(col._id)}
                project={project}
                onOpenTask={setOpenTaskId}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        </DragDropContext>
      ) : (
        <table className="list-view">
          <thead>
            <tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due date</th></tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const col = columns.find((c) => c._id === t.column);
              return (
                <tr key={t._id} onClick={() => setOpenTaskId(t._id)} style={{ cursor: 'pointer' }}>
                  <td>{t.title}</td>
                  <td><div className="avatar-stack">{t.assignees.map((a) => <Avatar key={a._id} user={a} size={22} />)}</div></td>
                  <td><span className={`badge badge-priority-${t.priority}`}>{PRIORITY_LABEL[t.priority]}</span></td>
                  <td>{col?.name}</td>
                  <td style={{ color: isOverdue(t.dueDate) ? 'var(--danger)' : 'inherit' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {openTaskId && (
        <TaskModal
          taskId={openTaskId}
          project={project}
          members={members}
          onClose={() => setOpenTaskId(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}
