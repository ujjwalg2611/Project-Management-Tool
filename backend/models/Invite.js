const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invite', inviteSchema);
