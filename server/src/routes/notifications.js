const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) { res.status(500).json({ error: 'Failed to update notifications' }); }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, read: false } });
    res.json({ count });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch count' }); }
});

module.exports = router;
