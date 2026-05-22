const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/:username — Public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        coverUrl: true, bio: true, interests: true, isVerified: true, createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/profile — Update own profile
router.put('/profile', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const { displayName, bio, interests, moodMode } = req.body;
    const data = {};

    if (displayName) data.displayName = displayName;
    if (bio !== undefined) data.bio = bio;
    if (interests) data.interests = typeof interests === 'string' ? JSON.parse(interests) : interests;
    if (moodMode) data.moodMode = moodMode;
    if (req.file) {
      const type = req.file.mimetype.startsWith('video') ? 'videos' : 'images';
      data.avatarUrl = `/uploads/${type}/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        coverUrl: true, bio: true, interests: true, moodMode: true, createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } }
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: req.params.id
        }
      }
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    // Follow
    await prisma.follow.create({
      data: { followerId: req.user.id, followingId: req.params.id }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'follow',
        content: `${req.user.displayName} started following you`,
        userId: req.params.id,
        refId: req.user.id
      }
    });

    res.json({ following: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Follow action failed' });
  }
});

// GET /api/users/:id/followers
router.get('/:id/followers', async (req, res) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.params.id },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(followers.map(f => f.follower));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/users/:id/following
router.get('/:id/following', async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.params.id },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(following.map(f => f.following));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// GET /api/users/search?q=query
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
      take: 20
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
