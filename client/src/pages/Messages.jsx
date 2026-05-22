import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiPaperAirplane } from 'react-icons/hi2';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    api.getConversations().then(setConversations).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeChat) {
      api.getMessages(activeChat.id).then(setMessages).catch(console.error);
    }
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try { const res = await api.searchUsers(q); setSearchResults(res.filter(u => u.id !== user.id)); }
    catch (err) { console.error(err); }
  };

  const startChat = (contact) => {
    setActiveChat(contact);
    setSearchQuery('');
    setSearchResults([]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    try {
      const msg = await api.sendMessage(activeChat.id, newMsg);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="messages-layout">
      <div className="conversations-list">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16, padding: '0 4px' }}>Messages</h2>
        <input value={searchQuery} onChange={e => handleSearch(e.target.value)}
          placeholder="Search people..." style={{ marginBottom: 12, borderRadius: 'var(--radius-full)', padding: '10px 16px', fontSize: '0.85rem' }} />
        
        {searchResults.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {searchResults.map(u => (
              <div key={u.id} className="conversation-item" onClick={() => startChat(u)}>
                <img src={u.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${u.username}`} alt="" />
                <div className="conversation-info">
                  <div className="name">{u.displayName}</div>
                  <div className="last-msg">@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? <div className="spinner" /> : conversations.map((conv, i) => (
          <div key={i} className={`conversation-item ${activeChat?.id === conv.contact?.id ? 'active' : ''}`}
            onClick={() => startChat(conv.contact)}>
            <img src={conv.contact?.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${conv.contact?.username}`} alt="" />
            <div className="conversation-info">
              <div className="name">{conv.contact?.displayName}</div>
              <div className="last-msg">{conv.lastMessage?.content || 'No messages'}</div>
            </div>
            {conv.unreadCount > 0 && <div className="unread-badge">{conv.unreadCount}</div>}
          </div>
        ))}
      </div>

      <div className="chat-area">
        {activeChat ? (
          <>
            <div className="chat-header">
              <img src={activeChat.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${activeChat.username}`}
                alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activeChat.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{activeChat.username}</div>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                  {msg.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form className="chat-input-area" onSubmit={sendMessage}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message..." />
              <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: '50%', padding: 10 }}>
                <HiPaperAirplane style={{ width: 18, height: 18 }} />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <h3>Select a conversation</h3>
              <p>Choose from existing chats or search for someone new</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
