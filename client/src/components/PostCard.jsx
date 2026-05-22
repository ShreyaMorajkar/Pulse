import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiHeart, HiChatBubbleLeft, HiShare, HiEllipsisHorizontal } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'love', emoji: '❤️' },
  { type: 'think', emoji: '🤔' },
  { type: 'laugh', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
];

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function PostCard({ post: initialPost }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(initialPost.liked || false);
  const [likeCount, setLikeCount] = useState(initialPost._count?.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(initialPost.comments || []);
  const [userReaction, setUserReaction] = useState(initialPost.userReaction || null);

  const handleLike = async () => {
    try {
      const res = await api.likePost(post.id);
      setLiked(res.liked);
      setLikeCount(prev => res.liked ? prev + 1 : prev - 1);
    } catch (err) { console.error(err); }
  };

  const handleReact = async (type) => {
    try {
      const res = await api.reactPost(post.id, type);
      setUserReaction(res.reaction);
    } catch (err) { console.error(err); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const newComment = await api.commentPost(post.id, comment);
      setComments(prev => [newComment, ...prev]);
      setComment('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author?.username}`}>
          <img className="post-avatar" src={post.author?.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${post.author?.username}`} alt="" />
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${post.author?.username}`}>
            <span className="post-author-name">
              {post.author?.displayName}
              {post.author?.isVerified && <span className="verified">✓</span>}
            </span>
          </Link>
          <div className="post-username">@{post.author?.username} · {timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {post.content && <div className="post-content">{post.content}</div>}

      {post.mediaUrls?.length > 0 && (
        <div className="post-media">
          {post.mediaType === 'video' ? (
            <video src={`http://localhost:5000${post.mediaUrls[0]}`} controls />
          ) : (
            <img src={`http://localhost:5000${post.mediaUrls[0]}`} alt="" />
          )}
        </div>
      )}

      <div className="reactions-bar">
        {REACTIONS.map(r => (
          <button key={r.type} className={`reaction-btn ${userReaction === r.type ? 'active' : ''}`}
            onClick={() => handleReact(r.type)} title={r.type}>
            {r.emoji}
          </button>
        ))}
      </div>

      <div className="post-actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <HiHeart /> {likeCount > 0 && likeCount}
        </button>
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
          <HiChatBubbleLeft /> {post._count?.comments > 0 && post._count.comments}
        </button>
        <button className="post-action-btn" onClick={() => navigator.clipboard?.writeText(window.location.origin + '/post/' + post.id)}>
          <HiShare />
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 12 }}>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Write a comment..." style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: '0.85rem' }} />
            <button type="submit" className="btn btn-primary btn-sm">Post</button>
          </form>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: '8px 0' }}>
              <img src={c.author?.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${c.author?.username}`}
                alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.author?.displayName}</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
