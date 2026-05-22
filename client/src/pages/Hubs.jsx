import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiUserGroup, HiChatBubbleLeftRight, HiPlus } from 'react-icons/hi2';

export default function Hubs() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'general' });

  useEffect(() => {
    api.getHubs().then(setHubs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const hub = await api.createHub(form);
      setHubs(prev => [{ ...hub, _count: { members: 1, posts: 0 } }, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', category: 'general' });
    } catch (err) { console.error(err); }
  };

  const handleJoin = async (hubId) => {
    try {
      const res = await api.joinHub(hubId);
      setHubs(prev => prev.map(h => h.id === hubId
        ? { ...h, _count: { ...h._count, members: h._count.members + (res.joined ? 1 : -1) } }
        : h));
    } catch (err) { console.error(err); }
  };

  const categories = ['general', 'technology', 'art', 'gaming', 'music', 'fitness', 'science', 'food'];

  return (
    <div className="page-container page-wide">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Community Hubs</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          <HiPlus /> Create Hub
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Create a New Hub</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Hub name" required />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What's this hub about?" required rows={3}
              style={{ resize: 'none' }} />
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: 'auto' }}>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm">Create</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner" /> : hubs.length === 0 ? (
        <div className="empty-state">
          <h3>No hubs yet</h3>
          <p>Create the first community hub on Pulse!</p>
        </div>
      ) : (
        <div className="hubs-grid">
          {hubs.map(hub => (
            <div key={hub.id} className="hub-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--accent-glow)',
                  color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {hub.category}
                </span>
              </div>
              <h3>{hub.name}</h3>
              <p>{hub.description}</p>
              <div className="hub-meta">
                <span><HiUserGroup style={{ display: 'inline', verticalAlign: 'middle' }} /> {hub._count?.members || 0} members</span>
                <span><HiChatBubbleLeftRight style={{ display: 'inline', verticalAlign: 'middle' }} /> {hub._count?.posts || 0} posts</span>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }}
                onClick={() => handleJoin(hub.id)}>
                Join Hub
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
