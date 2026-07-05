const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    url: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String }, // e.g. 'status_change', 'assignee_added', 'comment', 'created'
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const dependencySchema = new mongoose.Schema(
  {
    dependsOnTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['finish_to_start'], default: 'finish_to_start' },
  },
  { timestamps: false }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    column: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // references Project.columns._id
    title: { type: String, required: true, trim: true },
    description: { type: mongoose.Schema.Types.Mixed, default: null }, // rich text JSON (Tiptap doc)
    priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'], default: 'medium' },
    order: { type: Number, required: true, default: 0 },
    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null }, // for timeline/gantt view
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: mongoose.Schema.Types.ObjectId }], // references Project.tags._id
    subtasks: [subtaskSchema],
    attachments: [attachmentSchema],
    dependencies: [dependencySchema],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    activity: [activitySchema],
    isCompleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, column: 1, order: 1 });

module.exports = mongoose.model('Task', taskSchema);
