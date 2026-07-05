const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

workspaceSchema.methods.roleOf = function (userId) {
  if (this.owner.toString() === userId.toString()) return 'admin';
  const m = this.members.find((m) => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
