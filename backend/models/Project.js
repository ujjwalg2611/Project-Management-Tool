const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: false }
);

const columnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    color: { type: String, default: '#94a3b8' },
    wipLimit: { type: Number, default: null },
  },
  { timestamps: false }
);

const projectSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: '📋' },
    isArchived: { type: Boolean, default: false },
    isStarredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    columns: [columnSchema],
    tags: [tagSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Default columns for new projects
projectSchema.statics.defaultColumns = () => ([
  { name: 'To Do', order: 0, color: '#94a3b8' },
  { name: 'In Progress', order: 1, color: '#3b82f6' },
  { name: 'In Review', order: 2, color: '#f59e0b' },
  { name: 'Done', order: 3, color: '#22c55e' },
]);

module.exports = mongoose.model('Project', projectSchema);
