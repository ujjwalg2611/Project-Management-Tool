const express = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('actor', 'name avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
