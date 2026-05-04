// src/lib/realtime.ts
import { io, Socket } from 'socket.io-client';

export type UserEvent = {
  type: 'login' | 'signup';
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  timestamp: string;
};

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Determine Socket.IO URL - should match API_BASE_URL logic
    let socketUrl: string;
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Render deployment - use same logic as API_BASE_URL
    if (host.includes('onrender.com')) {
      // If frontend is on Render, backend should be at the same domain or via pattern
      if (host === 'smpmps-test.onrender.com' || host === 'smpmps-frontend.onrender.com') {
        socketUrl = 'https://smpmps-backend.onrender.com';
      } else if (host.endsWith('-frontend.onrender.com')) {
        const baseName = host.replace('-frontend.onrender.com', '-backend.onrender.com');
        socketUrl = `https://${baseName}`;
      } else {
        socketUrl = `${protocol}//${host}`;
      }
    } else if (import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL;
    } else {
      socketUrl = 'http://localhost:3001';
    }
    
    console.log('🔌 Socket.IO connecting to:', socketUrl);
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
  }
  return socket;
}

export function subscribeToUserEvents(cb: (event: UserEvent) => void) {
  const s = getSocket();
  s.on('user:event', cb);
  return () => s.off('user:event', cb);
}
