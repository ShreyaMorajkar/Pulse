const jwt = require('jsonwebtoken');

const onlineUsers = new Map();

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit('user_online', { userId, online: true });

    socket.on('join_room', (roomId) => { socket.join(`room:${roomId}`); });
    socket.on('leave_room', (roomId) => { socket.leave(`room:${roomId}`); });

    socket.on('send_message', (data) => {
      io.to(`user:${data.receiverId}`).emit('new_message', { ...data, senderId: userId });
    });

    socket.on('typing', (data) => {
      io.to(`user:${data.receiverId}`).emit('user_typing', { userId, typing: true });
    });

    socket.on('stop_typing', (data) => {
      io.to(`user:${data.receiverId}`).emit('user_typing', { userId, typing: false });
    });

    socket.on('room_message', (data) => {
      io.to(`room:${data.roomId}`).emit('room_message', { ...data, senderId: userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_online', { userId, online: false });
    });
  });
}

module.exports = { setupSocket };
