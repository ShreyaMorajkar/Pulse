const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hubs
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    const hubs = await prisma.hub.findMany({
      where, include: { _count: { select: { members: true, posts: true } } },
      orderBy: { members: { _count: 'desc' } }, take: 50
    });
    res.json(hubs);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch hubs' }); }
});

// POST /api/hubs
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, category, isPrivate } = req.body;
    if (!name || !description || !category) return res.status(400).json({ error: 'Name, description, and category are required' });
    const hub = await prisma.hub.create({
      data: { name, description, category, isPrivate: isPrivate || false }
    });
    await prisma.hubMember.create({ data: { userId: req.user.id, hubId: hub.id, role: 'admin' } });
    res.status(201).json(hub);
  } catch (error) { res.status(500).json({ error: 'Failed to create hub' }); }
});

// POST /api/hubs/:id/join
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const existing = await prisma.hubMember.findUnique({ where: { userId_hubId: { userId: req.user.id, hubId: req.params.id } } });
    if (existing) {
      if (existing.role !== 'admin') { await prisma.hubMember.delete({ where: { id: existing.id } }); return res.json({ joined: false }); }
      return res.status(400).json({ error: 'Admin cannot leave the hub' });
    }
    await prisma.hubMember.create({ data: { userId: req.user.id, hubId: req.params.id } });
    res.json({ joined: true });
  } catch (error) { res.status(500).json({ error: 'Failed to join hub' }); }
});

// GET /api/hubs/:id
router.get('/:id', async (req, res) => {
  try {
    const hub = await prisma.hub.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { members: true, posts: true } },
        members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }, take: 10 },
        rooms: { where: { expiresAt: { gte: new Date() } }, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!hub) return res.status(404).json({ error: 'Hub not found' });
    res.json(hub);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch hub' }); }
});

// POST /api/hubs/:id/rooms — Create Pop-up Room
router.post('/:id/rooms', authenticate, async (req, res) => {
  try {
    const { name, type } = req.body;
    const room = await prisma.room.create({
      data: { name: name || 'Pop-up Room', type: type || 'chat', hubId: req.params.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    await prisma.roomParticipant.create({ data: { userId: req.user.id, roomId: room.id } });
    res.status(201).json(room);
  } catch (error) { res.status(500).json({ error: 'Failed to create room' }); }
});

module.exports = router;
