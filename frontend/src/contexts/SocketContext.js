import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        upgrade: false
      });

      // Join user to their room
      newSocket.emit('join', user.id);

      // Listen for connection
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setSocket(newSocket);
      });

      // Listen for new followers
      newSocket.on('new_follower', (data) => {
        toast.success(`${data.follower.firstName} ${data.follower.lastName} started following you!`);
      });

      // Listen for new likes
      newSocket.on('like_added', (data) => {
        // Handle real-time like updates
        console.log('New like:', data);
      });

      // Listen for new comments
      newSocket.on('comment_added', (data) => {
        // Handle real-time comment updates
        console.log('New comment:', data);
      });

      // Listen for new posts
      newSocket.on('new_post', (data) => {
        // Handle real-time post updates
        console.log('New post:', data);
      });

      // Listen for online users
      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      // Listen for user online status
      newSocket.on('user_online', (userId) => {
        setOnlineUsers(prev => [...prev, userId]);
      });

      newSocket.on('user_offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      // Listen for notifications
      newSocket.on('notification', (notification) => {
        switch (notification.type) {
          case 'like':
            toast.success(`${notification.sender.firstName} liked your post`);
            break;
          case 'comment':
            toast.success(`${notification.sender.firstName} commented on your post`);
            break;
          case 'follow':
            toast.success(`${notification.sender.firstName} started following you`);
            break;
          case 'mention':
            toast.success(`${notification.sender.firstName} mentioned you`);
            break;
          default:
            toast.success('New notification');
        }
      });

      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setSocket(null);
      });

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setOnlineUsers([]);
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setOnlineUsers([]);
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket event emitters
  const emitNewComment = (commentData) => {
    if (socket) {
      socket.emit('new_comment', commentData);
    }
  };

  const emitNewLike = (likeData) => {
    if (socket) {
      socket.emit('new_like', likeData);
    }
  };

  const emitNewFollow = (followData) => {
    if (socket) {
      socket.emit('new_follow', followData);
    }
  };

  const emitTyping = (data) => {
    if (socket) {
      socket.emit('typing', data);
    }
  };

  const emitStopTyping = (data) => {
    if (socket) {
      socket.emit('stop_typing', data);
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const value = {
    socket,
    onlineUsers,
    isUserOnline,
    emitNewComment,
    emitNewLike,
    emitNewFollow,
    emitTyping,
    emitStopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
