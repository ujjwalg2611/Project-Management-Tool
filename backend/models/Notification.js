const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_assigned', 'mention', 'due_soon', 'status_changed', 'comment_added'],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
