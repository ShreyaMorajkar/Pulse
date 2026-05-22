import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await api.getUser(username);
        setProfile(p);
        setBio(p.bio || '');
        const userPosts = await api.getUserPosts(p.id);
        setPosts(userPosts);
        if (!isOwnProfile && currentUser) {
          const followers = await api.getFollowers(p.id);
          setIsFollowing(followers.some(f => f.id === currentUser.id));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [username]);

  const handleFollow = async () => {
    try {
      const res = await api.followUser(profile.id);
      setIsFollowing(res.following);
      setProfile(p => ({
        ...p,
        _count: { ...p._count, followers: p._count.followers + (res.following ? 1 : -1) }
      }));
    } catch (err) { console.error(err); }
  };

  const handleSaveBio = async () => {
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      await api.updateProfile(formData);
      setProfile(p => ({ ...p, bio }));
      setEditing(false);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-container"><div className="spinner" /></div>;
  if (!profile) return <div className="page-container"><div className="empty-state"><h3>User not found</h3></div></div>;

  return (
    <div className="page-container">
      <div className="profile-header animate-in">
        <div className="profile-cover">
          {profile.coverUrl && <img src={profile.coverUrl} alt="" />}
        </div>
        <div className="profile-info">
          <img className="profile-avatar"
            src={profile.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${profile.username}`} alt="" />
          <div className="profile-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 className="profile-name">{profile.displayName}</h1>
              {!isOwnProfile && (
                <button className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollow}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwnProfile && !editing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>
            <div className="profile-handle">@{profile.username}</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Write your bio..."
                  style={{ flex: 1, borderRadius: 20, padding: '6px 14px', fontSize: '0.85rem' }} />
                <button className="btn btn-primary btn-sm" onClick={handleSaveBio}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div className="profile-bio">{profile.bio || 'No bio yet'}</div>
            )}
            <div className="profile-stats">
              <div className="profile-stat"><strong>{profile._count?.posts || 0}</strong> <span>posts</span></div>
              <div className="profile-stat"><strong>{profile._count?.followers || 0}</strong> <span>followers</span></div>
              <div className="profile-stat"><strong>{profile._count?.following || 0}</strong> <span>following</span></div>
            </div>
            {profile.interests?.length > 0 && (
              <div className="profile-interests">
                {profile.interests.map((tag, i) => <span key={i} className="interest-tag">{tag}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 16 }}>Posts</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.length === 0 ? (
          <div className="empty-state"><h3>No posts yet</h3></div>
        ) : posts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
