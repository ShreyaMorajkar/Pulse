const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('pulse_token');

const headers = (isJson = true) => {
  const h = {};
  if (isJson) h['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const api = {
  // Auth
  register: (body) => fetch(`${API_URL}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
  login: (body) => fetch(`${API_URL}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
  getMe: () => fetch(`${API_URL}/auth/me`, { headers: headers() }).then(handleRes),

  // Users
  getUser: (username) => fetch(`${API_URL}/users/${username}`, { headers: headers() }).then(handleRes),
  updateProfile: (formData) => fetch(`${API_URL}/users/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }, body: formData }).then(handleRes),
  followUser: (id) => fetch(`${API_URL}/users/${id}/follow`, { method: 'POST', headers: headers() }).then(handleRes),
  getFollowers: (id) => fetch(`${API_URL}/users/${id}/followers`, { headers: headers() }).then(handleRes),
  getFollowing: (id) => fetch(`${API_URL}/users/${id}/following`, { headers: headers() }).then(handleRes),
  searchUsers: (q) => fetch(`${API_URL}/users?q=${q}`, { headers: headers() }).then(handleRes),

  // Posts
  createPost: (formData) => fetch(`${API_URL}/posts`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData }).then(handleRes),
  getPost: (id) => fetch(`${API_URL}/posts/${id}`, { headers: headers() }).then(handleRes),
  deletePost: (id) => fetch(`${API_URL}/posts/${id}`, { method: 'DELETE', headers: headers() }).then(handleRes),
  likePost: (id) => fetch(`${API_URL}/posts/${id}/like`, { method: 'POST', headers: headers() }).then(handleRes),
  reactPost: (id, type) => fetch(`${API_URL}/posts/${id}/react`, { method: 'POST', headers: headers(), body: JSON.stringify({ type }) }).then(handleRes),
  commentPost: (id, content) => fetch(`${API_URL}/posts/${id}/comment`, { method: 'POST', headers: headers(), body: JSON.stringify({ content }) }).then(handleRes),
  getUserPosts: (userId, page = 1) => fetch(`${API_URL}/posts/user/${userId}?page=${page}`, { headers: headers() }).then(handleRes),

  // Feed
  getFeed: (mode = 'foryou', mood = 'all', page = 1) => fetch(`${API_URL}/feed?mode=${mode}&mood=${mood}&page=${page}`, { headers: headers() }).then(handleRes),
  getTrending: () => fetch(`${API_URL}/feed/trending`, { headers: headers() }).then(handleRes),

  // Messages
  getConversations: () => fetch(`${API_URL}/messages/conversations`, { headers: headers() }).then(handleRes),
  getMessages: (userId, page = 1) => fetch(`${API_URL}/messages/${userId}?page=${page}`, { headers: headers() }).then(handleRes),
  sendMessage: (userId, content) => fetch(`${API_URL}/messages/${userId}`, { method: 'POST', headers: headers(), body: JSON.stringify({ content }) }).then(handleRes),

  // Notifications
  getNotifications: () => fetch(`${API_URL}/notifications`, { headers: headers() }).then(handleRes),
  markAllRead: () => fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: headers() }).then(handleRes),
  getUnreadCount: () => fetch(`${API_URL}/notifications/unread-count`, { headers: headers() }).then(handleRes),

  // Hubs
  getHubs: (category) => fetch(`${API_URL}/hubs${category ? `?category=${category}` : ''}`, { headers: headers() }).then(handleRes),
  getHub: (id) => fetch(`${API_URL}/hubs/${id}`, { headers: headers() }).then(handleRes),
  createHub: (body) => fetch(`${API_URL}/hubs`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
  joinHub: (id) => fetch(`${API_URL}/hubs/${id}/join`, { method: 'POST', headers: headers() }).then(handleRes),
  createRoom: (hubId, body) => fetch(`${API_URL}/hubs/${hubId}/rooms`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleRes),
};

export default api;
