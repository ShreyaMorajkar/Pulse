import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiHome, HiChatBubbleLeftRight, HiBell, HiUserGroup, HiArrowRightOnRectangle, HiUser } from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/', icon: <HiHome />, label: 'Feed' },
    { to: `/profile/${user?.username}`, icon: <HiUser />, label: 'Profile' },
    { to: '/messages', icon: <HiChatBubbleLeftRight />, label: 'Messages' },
    { to: '/notifications', icon: <HiBell />, label: 'Notifications' },
    { to: '/hubs', icon: <HiUserGroup />, label: 'Community Hubs' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Pulse</div>
      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="sidebar-user">
          <img src={user.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${user.username}`} alt="" />
          <div className="sidebar-user-info">
            <p>{user.displayName}</p>
            <span>@{user.username}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <HiArrowRightOnRectangle style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
          </button>
        </div>
      )}
    </aside>
  );
}
