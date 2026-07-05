const express = require('express');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/comments?taskId=...
router.get('/', async (req, res, next) => {
  try {
    const { taskId } = req.query;
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name avatar')
      .populate('mentions', 'name')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/comments - create, parsing @mentions like @[Name](userId)
router.post('/', async (req, res, next) => {
  try {
    const { taskId, content, mentionedUserIds = [] } = req.body;
    if (!taskId || !content) return res.status(400).json({ error: 'taskId and content are required' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content,
      mentions: mentionedUserIds,
    });

    task.activity.push({ actor: req.user._id, type: 'comment', createdAt: new Date() });
    await task.save();

    const io = req.app.get('io');

    // Notify mentioned users
    for (const userId of mentionedUserIds) {
      if (String(userId) === String(req.user._id)) continue;
      const notif = await Notification.create({
        user: userId,
        type: 'mention',
        actor: req.user._id,
        task: taskId,
        project: task.project,
        message: `${req.user.name} mentioned you in a comment`,
      });
      if (io) io.to(`user:${userId}`).emit('notification:new', notif);
    }

    // Notify watchers + assignees (excluding commenter and already-mentioned)
    const notifyTargets = new Set([...task.watchers.map(String), ...task.assignees.map(String)]);
    notifyTargets.delete(String(req.user._id));
    for (const userId of mentionedUserIds.map(String)) notifyTargets.delete(userId);

    for (const userId of notifyTargets) {
      const notif = await Notification.create({
        user: userId,
        type: 'comment_added',
        actor: req.user._id,
        task: taskId,
        project: task.project,
        message: `${req.user.name} commented on "${task.title}"`,
      });
      if (io) io.to(`user:${userId}`).emit('notification:new', notif);
    }

    const populated = await comment.populate('user', 'name avatar');
    if (io) io.to(`project:${task.project}`).emit('comment:created', { taskId, comment: populated });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/comments/:id - edit own comment
router.patch('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Can only edit your own comments' });
    }
    comment.content = req.body.content;
    comment.editedAt = new Date();
    await comment.save();
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id - delete own comment
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/comments/:id/react - toggle emoji reaction
router.post('/:id/react', async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    let reaction = comment.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [] };
      comment.reactions.push(reaction);
    }
    const idx = reaction.users.findIndex((id) => id.toString() === req.user._id.toString());
    if (idx >= 0) reaction.users.splice(idx, 1);
    else reaction.users.push(req.user._id);

    comment.reactions = comment.reactions.filter((r) => r.users.length > 0);
    await comment.save();
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
