import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface PriceUpdate {
  marketId: string;
  productId: number;
  category: string;
  price: number;
  previousPrice?: number;
  change: number;
  productName: string;
  marketName: string;
  timestamp: string;
}

interface Notification {
  id?: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  timestamp: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  subscribeToMarket: (marketId: string) => void;
  unsubscribeFromMarket: (marketId: string) => void;
  subscribeToProduct: (productId: number) => void;
  subscribeToCategory: (category: string) => void;
  subscribeToPrices: (filters: { marketId?: string; productId?: number; category?: string }) => void;
  unsubscribePrices: (filters: { marketId?: string; productId?: number; category?: string }) => void;
  priceUpdates: PriceUpdate[];
  notifications: Notification[];
  clearNotifications: () => void;
  authenticate: (userId: string, token: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Determine Socket.IO URL with dynamic Render detection
const SOCKET_URL = (() => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Render deployment detection (same logic as main API)
  if (host.includes('onrender.com')) {
    if (host === 'smpmps-test.onrender.com' || host === 'smpmps-frontend.onrender.com') {
      return 'https://smpmps-backend.onrender.com';
    }
    if (host.endsWith('-frontend.onrender.com')) {
      return `https://${host.replace('-frontend.onrender.com', '-backend.onrender.com')}`;
    }
    return `${protocol}//${host}`;
  }
  
  // Local development
  return import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || `${protocol}//${host}:3001`;
})();

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
    });

    newSocket.on('authenticated', (data: { success: boolean }) => {
      if (data.success) {
        setIsAuthenticated(true);
        console.log('✅ WebSocket authenticated');
      }
    });

    // Handle price updates
    newSocket.on('price:update', (update: { data: PriceUpdate }) => {
      console.log('📊 Price update received:', update);
      setPriceUpdates((prev) => [update.data, ...prev.slice(0, 49)]); // Keep last 50 updates
      
      // Show toast for significant changes (>5%)
      if (Math.abs(update.data.change) >= 5) {
        const direction = update.data.change > 0 ? '📈' : '📉';
        toast.info(`${direction} ${update.data.productName}: ${update.data.change}% change`);
      }
    });

    // Handle notifications
    newSocket.on('notification', (payload: { data: Notification }) => {
      console.log('🔔 Notification received:', payload);
      const notification = payload.data;
      setNotifications((prev) => [notification, ...prev.slice(0, 99)]); // Keep last 100
      
      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast.warning(notification.title, {
          description: notification.message,
          duration: 10000,
        });
      } else {
        toast.info(notification.title, {
          description: notification.message,
        });
      }
    });

    // Handle market status updates
    newSocket.on('market:status', (update: { marketId: string; status: string }) => {
      console.log('🏪 Market status update:', update);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const authenticate = useCallback((userId: string, token: string) => {
    if (socket && isConnected) {
      socket.emit('authenticate', { userId, token });
      // Subscribe to user's notifications
      socket.emit('subscribe:notifications', { userId });
    }
  }, [socket, isConnected]);

  const subscribeToMarket = useCallback((marketId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:prices', { marketId });
    }
  }, [socket, isConnected]);

  const unsubscribeFromMarket = useCallback((marketId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe:prices', { marketId });
    }
  }, [socket, isConnected]);

  const subscribeToProduct = useCallback((productId: number) => {
    if (socket && isConnected) {
      socket.emit('subscribe:prices', { productId });
    }
  }, [socket, isConnected]);

  const subscribeToCategory = useCallback((category: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:prices', { category });
    }
  }, [socket, isConnected]);

  const subscribeToPrices = useCallback((filters: { marketId?: string; productId?: number; category?: string }) => {
    if (socket && isConnected) {
      socket.emit('subscribe:prices', filters);
    }
  }, [socket, isConnected]);

  const unsubscribePrices = useCallback((filters: { marketId?: string; productId?: number; category?: string }) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe:prices', filters);
    }
  }, [socket, isConnected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isAuthenticated,
    subscribeToMarket,
    unsubscribeFromMarket,
    subscribeToProduct,
    subscribeToCategory,
    subscribeToPrices,
    unsubscribePrices,
    priceUpdates,
    notifications,
    clearNotifications,
    authenticate,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hook for subscribing to specific price updates
export function usePriceSubscription(filters: { marketId?: string; productId?: number; category?: string }) {
  const { subscribeToPrices, unsubscribePrices, priceUpdates, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected && (filters.marketId || filters.productId || filters.category)) {
      subscribeToPrices(filters);
      
      return () => {
        unsubscribePrices(filters);
      };
    }
  }, [isConnected, filters.marketId, filters.productId, filters.category, subscribeToPrices, unsubscribePrices]);

  // Filter updates based on subscription
  const relevantUpdates = priceUpdates.filter((update) => {
    if (filters.marketId && update.marketId !== filters.marketId) return false;
    if (filters.productId && update.productId !== filters.productId) return false;
    if (filters.category && update.category !== filters.category) return false;
    return true;
  });

  return relevantUpdates;
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const { notifications, clearNotifications, isConnected } = useWebSocket();
  const unreadCount = notifications.length;

  return {
    notifications,
    unreadCount,
    clearNotifications,
    isConnected,
  };
}

export default WebSocketContext;
