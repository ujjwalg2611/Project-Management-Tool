const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users/search?q=...&workspaceId=... - for @mention / assignee pickers
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const users = await User.find(filter).select('name email avatar').limit(20);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    await req.user.save();
    res.json(req.user.toSafeObject());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
