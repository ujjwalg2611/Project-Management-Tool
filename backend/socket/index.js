const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory presence map: taskId -> Set of {userId, name, socketId}
const taskPresence = new Map();

function initSocket(io) {
  // Auth middleware for socket handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('Invalid user'));
      socket.user = { id: user._id.toString(), name: user.name, avatar: user.avatar };
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join a project "room" to receive board-level events
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Task moved (column/order change) - client emits after optimistic update + API call
    socket.on('task:moved', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task:moved', task);
    });

    socket.on('task:updated', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task:updated', task);
    });

    socket.on('task:created', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task:created', task);
    });

    socket.on('task:deleted', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('task:deleted', { taskId });
    });

    socket.on('comment:created', ({ projectId, taskId, comment }) => {
      socket.to(`project:${projectId}`).emit('comment:created', { taskId, comment });
    });

    // Presence: "X is viewing this task"
    socket.on('task:view', ({ taskId }) => {
      if (!taskPresence.has(taskId)) taskPresence.set(taskId, new Map());
      taskPresence.get(taskId).set(socket.id, socket.user);
      socket.join(`task:${taskId}`);
      io.to(`task:${taskId}`).emit('task:presence', {
        taskId,
        viewers: Array.from(taskPresence.get(taskId).values()),
      });
    });

    socket.on('task:leave', ({ taskId }) => {
      taskPresence.get(taskId)?.delete(socket.id);
      socket.leave(`task:${taskId}`);
      io.to(`task:${taskId}`).emit('task:presence', {
        taskId,
        viewers: Array.from(taskPresence.get(taskId)?.values() || []),
      });
    });

    // Typing indicator in comment box
    socket.on('comment:typing', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('comment:typing', { taskId, user: socket.user });
    });

    // Per-user notification room, joined by userId so server can push directly
    socket.on('user:join', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      for (const [taskId, viewers] of taskPresence.entries()) {
        if (viewers.delete(socket.id)) {
          io.to(`task:${taskId}`).emit('task:presence', {
            taskId,
            viewers: Array.from(viewers.values()),
          });
        }
      }
    });
  });
}

// Helper other modules (e.g. routes) can use to push a notification in real-time
function emitNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}

module.exports = { initSocket, emitNotification };
