/**
 * WebSocket Module for Real-Time Updates
 * Provides live price updates, notifications, and market alerts
 */

import { Server } from 'socket.io';

let io = null;
const connectedUsers = new Map(); // userId -> Set of socket IDs
const marketSubscriptions = new Map(); // marketId -> Set of socket IDs

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: function(origin, callback) {
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:5174',
                    'http://localhost:3001',
                    'http://localhost:3000',
                    'http://127.0.0.1:5173',
                    'http://127.0.0.1:3000',
                    'https://smpmps-test.onrender.com',
                    'https://smpmps-frontend.onrender.com',
                ];
                
                if (!origin) {
                    callback(null, true);
                } else if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else if (origin && origin.includes('onrender.com')) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            },
            methods: ['GET', 'POST'],
            credentials: true,
            allowEIO3: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Handle user authentication
        socket.on('authenticate', (data) => {
            const { userId } = data;
            if (userId) {
                socket.userId = userId;
                if (!connectedUsers.has(userId)) {
                    connectedUsers.set(userId, new Set());
                }
                connectedUsers.get(userId).add(socket.id);
                socket.emit('authenticated', { success: true });
            }
        });

        // Subscribe to market updates
        socket.on('subscribe:market', (data) => {
            const { marketId } = data;
            if (marketId) {
                socket.join(`market:${marketId}`);
                if (!marketSubscriptions.has(marketId)) {
                    marketSubscriptions.set(marketId, new Set());
                }
                marketSubscriptions.get(marketId).add(socket.id);
                socket.emit('subscribed:market', { marketId });
            }
        });

        // Unsubscribe from market updates
        socket.on('unsubscribe:market', (data) => {
            const { marketId } = data;
            if (marketId) {
                socket.leave(`market:${marketId}`);
                if (marketSubscriptions.has(marketId)) {
                    marketSubscriptions.get(marketId).delete(socket.id);
                }
            }
        });

        // Subscribe to user notifications
        socket.on('subscribe:notifications', (data) => {
            const { userId } = data;
            if (userId) {
                socket.join(`user:${userId}`);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.userId && connectedUsers.has(socket.userId)) {
                connectedUsers.get(socket.userId).delete(socket.id);
                if (connectedUsers.get(socket.userId).size === 0) {
                    connectedUsers.delete(socket.userId);
                }
            }
        });
    });

    console.log('🚀 WebSocket server initialized');
    return io;
}

/**
 * Broadcast price update to market subscribers
 */
export function broadcastPriceUpdate(priceData) {
    if (!io) return;

    const { marketId, productId, price, previousPrice, productName, marketName } = priceData;

    const update = {
        type: 'price_update',
        data: {
            marketId,
            productId,
            price,
            previousPrice,
            change: previousPrice ? ((price - previousPrice) / previousPrice * 100).toFixed(2) : 0,
            productName,
            marketName,
            timestamp: new Date().toISOString()
        }
    };

    if (marketId) {
        io.to(`market:${marketId}`).emit('price:update', update);
    }
}

/**
 * Send notification to specific user
 */
export function sendUserNotification(userId, notification) {
    if (!io) return;

    const payload = {
        type: 'notification',
        data: {
            ...notification,
            timestamp: new Date().toISOString()
        }
    };

    io.to(`user:${userId}`).emit('notification', payload);
}

/**
 * Broadcast price alert triggered
 */
export function broadcastPriceAlert(alertData) {
    if (!io) return;

    const { userId, productName, marketName, targetPrice, currentPrice, alertType } = alertData;

    const notification = {
        title: 'Price Alert Triggered!',
        message: `${productName} at ${marketName} is now ${currentPrice} RWF (${alertType === 'below' ? 'below' : 'above'} your target of ${targetPrice} RWF)`,
        type: 'price_alert',
        priority: 'high'
    };

    sendUserNotification(userId, notification);
}

/**
 * Broadcast user event (login/signup)
 */
export function broadcastUserEvent(event) {
    if (!io) return;
    io.emit('user:event', {
        ...event,
        timestamp: new Date().toISOString()
    });
}

/**
 * Get connection statistics
 */
export function getStats() {
    return {
        totalConnections: io ? io.sockets.sockets.size : 0,
        authenticatedUsers: connectedUsers.size,
        marketSubscriptions: marketSubscriptions.size
    };
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
    return io;
}

export default {
    initializeWebSocket,
    broadcastPriceUpdate,
    sendUserNotification,
    broadcastPriceAlert,
    broadcastUserEvent,
    getStats,
    getIO
};