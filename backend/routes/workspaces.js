const express = require('express');
const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceRole } = require('../middleware/rbac');
const { sendInviteEmail } = require('../utils/email');

const router = express.Router();
router.use(requireAuth);

// GET /api/workspaces - list workspaces the current user belongs to
router.get('/', async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).populate('members.user', 'name email avatar');
    res.json(workspaces);
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces - create a new workspace
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    res.status(201).json(workspace);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:workspaceId - rename / update logo (admin only)
router.patch('/:workspaceId', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    const { name, logo } = req.body;
    if (name !== undefined) req.workspace.name = name;
    if (logo !== undefined) req.workspace.logo = logo;
    await req.workspace.save();
    res.json(req.workspace);
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:workspaceId/members
router.get('/:workspaceId/members', requireWorkspaceRole(['admin', 'member', 'viewer']), async (req, res, next) => {
  try {
    const ws = await Workspace.findById(req.params.workspaceId).populate('members.user', 'name email avatar createdAt');
    res.json(ws.members);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:workspaceId/members/:userId - change role (admin only)
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    const { role } = req.body;
    const member = req.workspace.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.role = role;
    await req.workspace.save();
    res.json(member);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:workspaceId/members/:userId - remove member (admin only)
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    req.workspace.members = req.workspace.members.filter((m) => m.user.toString() !== req.params.userId);
    await req.workspace.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:workspaceId/invites - invite a member by email (admin only)
router.post('/:workspaceId/invites', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const token = crypto.randomBytes(24).toString('hex');
    const invite = await Invite.create({
      workspace: req.workspace._id,
      email: email.toLowerCase(),
      role: role || 'member',
      token,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    try {
      await sendInviteEmail({
        to: email,
        workspaceName: req.workspace.name,
        inviterName: req.user.name,
        token,
      });
    } catch (emailErr) {
      // Don't fail the request if email sending fails (e.g. no SMTP configured in dev) - invite still usable via link
      console.warn('[email] failed to send invite email:', emailErr.message);
    }

    res.status(201).json(invite);
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:workspaceId/invites - list pending invites (admin only)
router.get('/:workspaceId/invites', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    const invites = await Invite.find({ workspace: req.params.workspaceId, usedAt: null });
    res.json(invites);
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:workspaceId/invites/:inviteId/resend (admin only)
router.post('/:workspaceId/invites/:inviteId/resend', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invite.save();
    await sendInviteEmail({ to: invite.email, workspaceName: req.workspace.name, inviterName: req.user.name, token: invite.token });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:workspaceId/invites/:inviteId - revoke (admin only)
router.delete('/:workspaceId/invites/:inviteId', requireWorkspaceRole(['admin']), async (req, res, next) => {
  try {
    await Invite.findByIdAndDelete(req.params.inviteId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
