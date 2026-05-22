const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/messages/conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const sent = await prisma.message.findMany({
      where: { senderId: req.user.id }, select: { receiverId: true }, distinct: ['receiverId']
    });
    const received = await prisma.message.findMany({
      where: { receiverId: req.user.id }, select: { senderId: true }, distinct: ['senderId']
    });
    const contactIds = [...new Set([...sent.map(s => s.receiverId), ...received.map(r => r.senderId)])];
    const conversations = await Promise.all(contactIds.map(async (contactId) => {
      const contact = await prisma.user.findUnique({
        where: { id: contactId },
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      });
      const lastMessage = await prisma.message.findFirst({
        where: { OR: [{ senderId: req.user.id, receiverId: contactId }, { senderId: contactId, receiverId: req.user.id }] },
        orderBy: { createdAt: 'desc' }
      });
      const unread = await prisma.message.count({
        where: { senderId: contactId, receiverId: req.user.id, read: false }
      });
      return { contact, lastMessage, unreadCount: unread };
    }));
    conversations.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
    res.json(conversations);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch conversations' }); }
});

// GET /api/messages/:userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user.id, receiverId: req.params.userId }, { senderId: req.params.userId, receiverId: req.user.id }] },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit
    });
    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: req.params.userId, receiverId: req.user.id, read: false },
      data: { read: true }
    });
    res.json(messages.reverse());
  } catch (error) { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

// POST /api/messages/:userId
router.post('/:userId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });
    const message = await prisma.message.create({
      data: { content, senderId: req.user.id, receiverId: req.params.userId }
    });
    const io = req.app.get('io');
    io.to(`user:${req.params.userId}`).emit('new_message', { ...message, sender: req.user });
    res.status(201).json(message);
  } catch (error) { res.status(500).json({ error: 'Failed to send message' }); }
});

module.exports = router;
