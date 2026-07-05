const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: false }
);

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true }, // markdown
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [reactionSchema],
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
