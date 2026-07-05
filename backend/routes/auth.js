const express = require('express');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Invite = require('../models/Invite');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
// Supports plain registration OR invite-based registration (?inviteToken=...)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, avatar, inviteToken } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, avatar: avatar || '' });

    let workspace;

    if (inviteToken) {
      const invite = await Invite.findOne({ token: inviteToken, usedAt: null });
      if (!invite) return res.status(400).json({ error: 'Invalid or expired invite' });
      if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invite has expired' });

      workspace = await Workspace.findById(invite.workspace);
      workspace.members.push({ user: user._id, role: invite.role });
      await workspace.save();

      invite.usedAt = new Date();
      await invite.save();
    } else {
      // New users without an invite get their own workspace
      workspace = await Workspace.create({
        name: `${name}'s Workspace`,
        owner: user._id,
        members: [{ user: user._id, role: 'admin' }],
      });
    }

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject(), workspace });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = router;
