import { useState, useRef } from 'react';
import { HiPhoto, HiVideoCamera, HiXMark } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Composer({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('social');
  const fileRef = useRef();

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
    setPreviews(selected.map(f => ({ url: URL.createObjectURL(f), type: f.type })));
  };

  const removeFile = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('category', category);
      files.forEach(f => formData.append('media', f));
      const post = await api.createPost(formData);
      onPostCreated?.(post);
      setContent(''); setFiles([]); setPreviews([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="composer">
      <div className="composer-input">
        <img src={user?.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${user?.username}`}
          alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind?" rows={2} />
      </div>
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', width: 100, height: 100 }}>
              {p.type.startsWith('video') ? (
                <video src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 2, color: '#fff' }}>
                <HiXMark size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="composer-footer">
        <div className="composer-actions">
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
          <button className="btn-icon" onClick={() => fileRef.current?.click()} title="Add photo">
            <HiPhoto style={{ width: 20, height: 20, color: 'var(--accent-teal)' }} />
          </button>
          <button className="btn-icon" onClick={() => { fileRef.current.accept = 'video/*'; fileRef.current?.click(); }} title="Add video">
            <HiVideoCamera style={{ width: 20, height: 20, color: 'var(--accent-coral)' }} />
          </button>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: 20, width: 'auto' }}>
            <option value="social">💬 Social</option>
            <option value="focus">🎯 Focus</option>
            <option value="inspiration">✨ Inspiration</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
