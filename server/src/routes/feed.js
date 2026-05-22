const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

const parsePost = (post) => {
  if (!post) return post;
  try { post.mediaUrls = JSON.parse(post.mediaUrls || '[]'); } catch { post.mediaUrls = []; }
  return post;
};

// GET /api/feed — Smart Feed (For You)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const mode = req.query.mode || 'foryou'; // "foryou" or "following"
    const mood = req.query.mood; // "focus", "inspiration", "social"

    let where = { visibility: 'public' };
    if (mood && mood !== 'all') where.category = mood;

    if (mode === 'following' && req.user) {
      const following = await prisma.follow.findMany({
        where: { followerId: req.user.id }, select: { followingId: true }
      });
      const followingIds = following.map(f => f.followingId);
      where.authorId = { in: followingIds };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { comments: true, likes: true, reactions: true } }
      },
      orderBy: mode === 'foryou'
        ? [{ viewCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    });

    // Add liked status for authenticated users
    if (req.user) {
      const postIds = posts.map(p => p.id);
      const likes = await prisma.like.findMany({
        where: { userId: req.user.id, postId: { in: postIds } }
      });
      const likedSet = new Set(likes.map(l => l.postId));
      const reactions = await prisma.reaction.findMany({
        where: { userId: req.user.id, postId: { in: postIds } }
      });
      const reactionMap = {};
      reactions.forEach(r => { reactionMap[r.postId] = r.type; });
      posts.forEach(p => { p.liked = likedSet.has(p.id); p.userReaction = reactionMap[p.id] || null; });
    }

    res.json(posts.map(parsePost));
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to load feed' }); }
});

// GET /api/feed/trending
router.get('/trending', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { visibility: 'public', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { comments: true, likes: true, reactions: true } }
      },
      orderBy: [{ likes: { _count: 'desc' } }, { viewCount: 'desc' }],
      take: 20
    });
    res.json(posts.map(parsePost));
  } catch (error) { res.status(500).json({ error: 'Failed to load trending' }); }
});

module.exports = router;
