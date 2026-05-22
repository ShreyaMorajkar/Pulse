const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();
const prisma = new PrismaClient();

// Helper to parse JSON string fields on posts
const parsePost = (post) => {
  if (!post) return post;
  try { post.mediaUrls = JSON.parse(post.mediaUrls || '[]'); } catch { post.mediaUrls = []; }
  return post;
};
const parsePosts = (posts) => posts.map(parsePost);

router.post('/', authenticate, upload.array('media', 4), async (req, res) => {
  try {
    const { content, category, visibility, hubId } = req.body;
    if (!content && (!req.files || req.files.length === 0))
      return res.status(400).json({ error: 'Post must have content or media' });

    const mediaUrls = req.files ? req.files.map(f => {
      const type = f.mimetype.startsWith('video') ? 'videos' : 'images';
      return `/uploads/${type}/${f.filename}`;
    }) : [];
    const mediaType = req.files?.length > 0
      ? (req.files[0].mimetype.startsWith('video') ? 'video' : 'image') : null;

    const post = await prisma.post.create({
      data: { content: content || '', mediaUrls: JSON.stringify(mediaUrls), mediaType, category: category || 'social',
        visibility: visibility || 'public', authorId: req.user.id, hubId: hubId || null },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { comments: true, likes: true, reactions: true } } }
    });
    res.status(201).json(parsePost(post));
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create post' }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        comments: { include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' }, take: 50 },
        reactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true, likes: true, reactions: true } } }
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    let liked = false, userReaction = null;
    if (req.user) {
      const like = await prisma.like.findUnique({ where: { userId_postId: { userId: req.user.id, postId: post.id } } });
      liked = !!like;
      const reaction = await prisma.reaction.findUnique({ where: { userId_postId: { userId: req.user.id, postId: post.id } } });
      userReaction = reaction?.type || null;
    }
    await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
    res.json({ ...parsePost(post), liked, userReaction });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch post' }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post deleted' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete post' }); }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: req.user.id, postId: req.params.id } } });
    if (existing) { await prisma.like.delete({ where: { id: existing.id } }); return res.json({ liked: false }); }
    await prisma.like.create({ data: { userId: req.user.id, postId: req.params.id } });
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (post && post.authorId !== req.user.id) {
      await prisma.notification.create({ data: { type: 'like', content: `${req.user.displayName} liked your post`, userId: post.authorId, refId: post.id } });
    }
    res.json({ liked: true });
  } catch (error) { res.status(500).json({ error: 'Like action failed' }); }
});

router.post('/:id/react', authenticate, async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['fire', 'love', 'think', 'laugh', 'wow', 'sad'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });
    const existing = await prisma.reaction.findUnique({ where: { userId_postId: { userId: req.user.id, postId: req.params.id } } });
    if (existing) {
      if (existing.type === type) { await prisma.reaction.delete({ where: { id: existing.id } }); return res.json({ reaction: null }); }
      const updated = await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
      return res.json({ reaction: updated.type });
    }
    await prisma.reaction.create({ data: { type, userId: req.user.id, postId: req.params.id } });
    res.json({ reaction: type });
  } catch (error) { res.status(500).json({ error: 'Reaction failed' }); }
});

router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });
    const comment = await prisma.comment.create({
      data: { content, authorId: req.user.id, postId: req.params.id },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (post && post.authorId !== req.user.id) {
      await prisma.notification.create({ data: { type: 'comment', content: `${req.user.displayName} commented on your post`, userId: post.authorId, refId: post.id } });
    }
    res.status(201).json(comment);
  } catch (error) { res.status(500).json({ error: 'Failed to create comment' }); }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const posts = await prisma.post.findMany({
      where: { authorId: req.params.userId, visibility: 'public' },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { comments: true, likes: true, reactions: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit
    });
    res.json(parsePosts(posts));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch user posts' }); }
});

module.exports = router;
