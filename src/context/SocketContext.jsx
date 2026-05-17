// ──────────────────────────────────────────────
// src/context/SocketContext.jsx  —  Real-time Socket.IO
// ──────────────────────────────────────────────
// Connects to the backend WebSocket gateway on login.
// Listens for 'notification' events and exposes them.
// Also provides an unread count for the sidebar badge.
// ──────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { renderNotificationText } from '../utils/notificationText';

const SOCKET_URL = 'http://localhost:3000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Real-time notifications received via WebSocket
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect when user logs in, disconnect on logout
  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setLiveNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('notification', (notification) => {
      console.log('🔔 Real-time notification:', notification);

      // Add to live list
      setLiveNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast
      const text = renderNotificationText(notification);
      toast(text, {
        icon: '🔔',
        duration: 5000,
        style: {
          background: '#1c1f2e',
          color: '#e8eaed',
          border: '1px solid rgba(108, 92, 231, 0.3)',
        },
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Called when user views notifications page to reset badge
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      liveNotifications,
      unreadCount,
      resetUnreadCount,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside <SocketProvider>');
  return ctx;
}
