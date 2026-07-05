const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Small helper to log an activity entry + optionally create notifications
function logActivity(task, actorId, type, meta = {}) {
  task.activity.push({ actor: actorId, type, meta, createdAt: new Date() });
}

async function notifyUsers(io, { userIds, type, actorId, taskId, projectId, message }) {
  const targets = [...new Set(userIds.map(String))].filter((id) => id !== String(actorId));
  for (const userId of targets) {
    const notif = await Notification.create({
      user: userId,
      type,
      actor: actorId,
      task: taskId,
      project: projectId,
      message,
    });
    if (io) io.to(`user:${userId}`).emit('notification:new', notif);
  }
}

// GET /api/tasks?projectId=... - list all tasks for a project (board/list/timeline views all use this)
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const tasks = await Task.find({ project: projectId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name avatar')
      .sort({ order: 1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/mine - "My Tasks" page (grouped client-side by due date)
router.get('/mine', async (req, res, next) => {
  try {
    const { filter } = req.query; // 'assigned' | 'created' | undefined (all)
    const query = {};
    if (filter === 'created') query.createdBy = req.user._id;
    else query.assignees = req.user._id;

    const tasks = await Task.find(query)
      .populate('project', 'name color icon')
      .populate('assignees', 'name avatar')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - full task detail
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('watchers', 'name avatar')
      .populate('createdBy', 'name avatar')
      .populate('activity.actor', 'name avatar')
      .populate('dependencies.dependsOnTask', 'title isCompleted');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - create task
router.post('/', async (req, res, next) => {
  try {
    const { projectId, columnId, title, priority, dueDate, assignees } = req.body;
    if (!projectId || !columnId || !title) {
      return res.status(400).json({ error: 'projectId, columnId, and title are required' });
    }

    const lastTask = await Task.findOne({ project: projectId, column: columnId }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      project: projectId,
      column: columnId,
      title,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignees: assignees || [],
      order,
      createdBy: req.user._id,
      activity: [{ actor: req.user._id, type: 'created', createdAt: new Date() }],
    });

    if (assignees?.length) {
      await notifyUsers(req.app.get('io'), {
        userIds: assignees,
        type: 'task_assigned',
        actorId: req.user._id,
        taskId: task._id,
        projectId,
        message: `${req.user.name} assigned you to "${title}"`,
      });
    }

    const populated = await task.populate('assignees', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id - generic field update (title, description, priority, dueDate, etc.)
// Also handles moving between columns / reordering when `column` and/or `order` are provided.
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const io = req.app.get('io');
    const before = { column: task.column?.toString(), assignees: task.assignees.map(String) };

    const fields = ['title', 'description', 'priority', 'dueDate', 'startDate', 'column', 'order', 'isCompleted'];
    for (const field of fields) {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    }

    if (req.body.assignees !== undefined) {
      task.assignees = req.body.assignees;
    }
    if (req.body.tags !== undefined) {
      task.tags = req.body.tags;
    }

    // Log column change as activity
    if (req.body.column !== undefined && req.body.column !== before.column) {
      const project = await Project.findById(task.project);
      const fromCol = project.columns.id(before.column)?.name || 'Unknown';
      const toCol = project.columns.id(req.body.column)?.name || 'Unknown';
      logActivity(task, req.user._id, 'status_change', { from: fromCol, to: toCol });
    }

    // Notify newly-added assignees
    if (req.body.assignees !== undefined) {
      const newlyAdded = req.body.assignees.filter((id) => !before.assignees.includes(String(id)));
      if (newlyAdded.length) {
        await notifyUsers(io, {
          userIds: newlyAdded,
          type: 'task_assigned',
          actorId: req.user._id,
          taskId: task._id,
          projectId: task.project,
          message: `${req.user.name} assigned you to "${task.title}"`,
        });
      }
    }

    await task.save();
    const populated = await task.populate('assignees', 'name email avatar');

    if (io) {
      io.to(`project:${task.project}`).emit('task:updated', populated);
    }

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/duplicate
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: 'Task not found' });
    delete task._id;
    delete task.createdAt;
    delete task.updatedAt;
    task.title = `${task.title} (copy)`;
    task.activity = [{ actor: req.user._id, type: 'created', createdAt: new Date() }];
    const copy = await Task.create(task);
    res.status(201).json(copy);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const io = req.app.get('io');
    if (io) io.to(`project:${task.project}`).emit('task:deleted', { taskId: task._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Subtasks ---

router.post('/:id/subtasks', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.subtasks.push({ title: req.body.title, order: task.subtasks.length });
    await task.save();
    res.status(201).json(task.subtasks[task.subtasks.length - 1]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/subtasks/:subtaskId', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
    if (req.body.title !== undefined) subtask.title = req.body.title;
    if (req.body.isCompleted !== undefined) subtask.isCompleted = req.body.isCompleted;
    await task.save();
    res.json(subtask);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/subtasks/:subtaskId', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    task.subtasks.id(req.params.subtaskId).deleteOne();
    await task.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Watch / unwatch ---

router.post('/:id/watch', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    const idx = task.watchers.findIndex((id) => id.toString() === req.user._id.toString());
    if (idx >= 0) task.watchers.splice(idx, 1);
    else task.watchers.push(req.user._id);
    await task.save();
    res.json({ watching: idx < 0 });
  } catch (err) {
    next(err);
  }
});

// --- Bulk operations (used by List View bulk-select) ---

router.post('/bulk/assign', async (req, res, next) => {
  try {
    const { taskIds, userId } = req.body;
    await Task.updateMany({ _id: { $in: taskIds } }, { $addToSet: { assignees: userId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk/move', async (req, res, next) => {
  try {
    const { taskIds, columnId } = req.body;
    await Task.updateMany({ _id: { $in: taskIds } }, { $set: { column: columnId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk/delete', async (req, res, next) => {
  try {
    const { taskIds } = req.body;
    await Task.deleteMany({ _id: { $in: taskIds } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
