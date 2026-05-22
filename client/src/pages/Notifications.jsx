import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiHeart, HiChatBubbleLeft, HiUserPlus, HiAtSymbol, HiFire } from 'react-icons/hi2';

const ICONS = {
  like: { icon: <HiHeart />, bg: 'rgba(255,107,107,0.15)', color: '#ff6b6b' },
  comment: { icon: <HiChatBubbleLeft />, bg: 'rgba(45,212,191,0.15)', color: '#2dd4bf' },
  follow: { icon: <HiUserPlus />, bg: 'rgba(124,92,252,0.15)', color: '#7c5cfc' },
  mention: { icon: <HiAtSymbol />, bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  reaction: { icon: <HiFire />, bg: 'rgba(236,72,153,0.15)', color: '#ec4899' },
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(setNotifications).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
          Notifications {unreadCount > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>({unreadCount})</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {loading ? <div className="spinner" /> : notifications.length === 0 ? (
        <div className="empty-state">
          <h3>All caught up!</h3>
          <p>You don't have any notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notifications.map(n => {
            const style = ICONS[n.type] || ICONS.like;
            return (
              <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                <div className="notification-icon" style={{ background: style.bg, color: style.color }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem' }}>{n.content}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
