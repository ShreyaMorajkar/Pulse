import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [mode, setMode] = useState('foryou');
  const [mood, setMood] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getFeed(mode, mood);
      setPosts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFeed(); }, [mode, mood]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const moods = [
    { key: 'all', label: 'All', icon: '✦' },
    { key: 'social', label: 'Social', icon: '💬' },
    { key: 'focus', label: 'Focus', icon: '🎯' },
    { key: 'inspiration', label: 'Inspiration', icon: '✨' },
  ];

  return (
    <div className="page-container">
      <div className="mood-toggles">
        {moods.map(m => (
          <button key={m.key} className={`mood-btn ${mood === m.key ? 'active' : ''}`}
            onClick={() => setMood(m.key)}>
            <span className="mood-icon">{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      <div className="feed-tabs">
        <button className={`feed-tab ${mode === 'foryou' ? 'active' : ''}`}
          onClick={() => setMode('foryou')}>For You</button>
        <button className={`feed-tab ${mode === 'following' ? 'active' : ''}`}
          onClick={() => setMode('following')}>Following</button>
      </div>

      <Composer onPostCreated={handlePostCreated} />

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.length === 0 ? (
            <div className="empty-state">
              <h3>No posts yet</h3>
              <p>Be the first to share something on Pulse!</p>
            </div>
          ) : posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
