/**
 * Broadcast user login/signup event
 */
export function broadcastUserEvent(event) {
    if (!io) return;
    io.emit('user:event', {
        ...event,
        timestamp: new Date().toISOString()
    });
}
/**
 * WebSocket Module for Real-Time Updates
 * Provides live price updates, notifications, and market alerts
 */

import { Server } from 'socket.io';

let io = null;
const connectedUsers = new Map(); // userId -> Set of socket IDs
const priceSubscriptions = new Map(); // socketId -> Set of marketId/productId combinations
const marketSubscriptions = new Map(); // marketId -> Set of socket IDs

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer, corsOptions = {}) {
    io = new Server(httpServer, {
        cors: {
            origin: function(origin, callback) {
                // For development and production
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:5174',
                    'http://localhost:3001',
                    'http://localhost:3000',
                    'http://127.0.0.1:5173',
                    'http://127.0.0.1:3000',
                    // Render production domains
                    'https://smpmps-test.onrender.com',
                    'https://smpmps-frontend.onrender.com',
                    'https://smpmps-test-1.onrender.com',
                    // Allow any onrender.com domain (flexible for different deployments)
                    // Check will happen below
                ];
                
                // Exact match or allow onrender.com domains
                if (!origin) {
                    // Allow requests with no origin (like mobile apps or server-to-server)
                    callback(null, true);
                } else if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else if (origin && origin.includes('onrender.com')) {
                    // For onrender.com deployments, be more permissive
                    console.log(`[Socket.IO] CORS allowed onrender.com origin: ${origin}`);
                    callback(null, true);
                } else {
                    console.warn(`[Socket.IO] CORS blocked origin: ${origin}`);
                    callback(null, false);
                }
            },
            methods: ['GET', 'POST'],
            credentials: true,
            allowEIO3: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
        allowUpgrades: true,
        maxHttpBufferSize: 1e6 // 1MB
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Handle user authentication
        socket.on('authenticate', (data) => {
            const { userId, token } = data;
            if (userId) {
                socket.userId = userId;
                if (!connectedUsers.has(userId)) {
                    connectedUsers.set(userId, new Set());
                }
                connectedUsers.get(userId).add(socket.id);
                console.log(`👤 User ${userId} authenticated on socket ${socket.id}`);
                socket.emit('authenticated', { success: true });
            }
        });

        // Subscribe to price updates for specific products/markets
        socket.on('subscribe:prices', (data) => {
            const { marketId, productId, category } = data;
            const subscriptionKey = `${marketId || 'all'}:${productId || 'all'}:${category || 'all'}`;
            
            if (!priceSubscriptions.has(socket.id)) {
                priceSubscriptions.set(socket.id, new Set());
            }
            priceSubscriptions.get(socket.id).add(subscriptionKey);

            // Subscribe to market room
            if (marketId) {
                socket.join(`market:${marketId}`);
                if (!marketSubscriptions.has(marketId)) {
                    marketSubscriptions.set(marketId, new Set());
                }
                marketSubscriptions.get(marketId).add(socket.id);
            }

            console.log(`📊 Socket ${socket.id} subscribed to prices: ${subscriptionKey}`);
            socket.emit('subscribed:prices', { subscriptionKey });
        });

        // Unsubscribe from price updates
        socket.on('unsubscribe:prices', (data) => {
            const { marketId, productId, category } = data;
            const subscriptionKey = `${marketId || 'all'}:${productId || 'all'}:${category || 'all'}`;
            
            if (priceSubscriptions.has(socket.id)) {
                priceSubscriptions.get(socket.id).delete(subscriptionKey);
            }

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
                console.log(`🔔 Socket ${socket.id} subscribed to notifications for user ${userId}`);
            }
        });

        // Request current prices
        socket.on('get:prices', async (data, callback) => {
            // This would fetch from database - callback provided by client
            if (callback) {
                callback({ status: 'pending' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
            
            // Clean up user connections
            if (socket.userId && connectedUsers.has(socket.userId)) {
                connectedUsers.get(socket.userId).delete(socket.id);
                if (connectedUsers.get(socket.userId).size === 0) {
                    connectedUsers.delete(socket.userId);
                }
            }

            // Clean up subscriptions
            priceSubscriptions.delete(socket.id);
            
            // Clean up market subscriptions
            for (const [marketId, sockets] of marketSubscriptions.entries()) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    marketSubscriptions.delete(marketId);
                }
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    console.log('🚀 WebSocket server initialized');
    return io;
}

/**
 * Broadcast price update to relevant subscribers
 */
export function broadcastPriceUpdate(priceData) {
    if (!io) return;

    const { marketId, productId, category, price, previousPrice, productName, marketName } = priceData;

    const update = {
        type: 'price_update',
        data: {
            marketId,
            productId,
            category,
            price,
            previousPrice,
            change: previousPrice ? ((price - previousPrice) / previousPrice * 100).toFixed(2) : 0,
            productName,
            marketName,
            timestamp: new Date().toISOString()
        }
    };

    // Broadcast to market room
    if (marketId) {
        io.to(`market:${marketId}`).emit('price:update', update);
    }

    // Broadcast to all clients subscribed to this specific combination
    for (const [socketId, subscriptions] of priceSubscriptions.entries()) {
        for (const sub of subscriptions) {
            const [subMarket, subProduct, subCategory] = sub.split(':');
            
            const marketMatch = subMarket === 'all' || subMarket === marketId;
            const productMatch = subProduct === 'all' || subProduct === String(productId);
            const categoryMatch = subCategory === 'all' || subCategory === category;
            
            if (marketMatch && productMatch && categoryMatch) {
                io.to(socketId).emit('price:update', update);
                break; // Only send once per socket
            }
        }
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

    // Send to user's room
    io.to(`user:${userId}`).emit('notification', payload);

    // Also send to all their connected sockets directly
    if (connectedUsers.has(userId)) {
        for (const socketId of connectedUsers.get(userId)) {
            io.to(socketId).emit('notification', payload);
        }
    }
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
 * Broadcast market status update (open/closed, busy level)
 */
export function broadcastMarketStatus(marketId, status) {
    if (!io) return;

    const update = {
        type: 'market_status',
        data: {
            marketId,
            ...status,
            timestamp: new Date().toISOString()
        }
    };

    io.to(`market:${marketId}`).emit('market:status', update);
}

/**
 * Broadcast new price submission (for vendors/admins)
 */
export function broadcastNewPriceSubmission(priceData) {
    if (!io) return;

    const update = {
        type: 'new_submission',
        data: {
            ...priceData,
            timestamp: new Date().toISOString()
        }
    };

    // Broadcast to admins
    io.to('role:admin').emit('price:submission', update);
}

/**
 * Get connection statistics
 */
export function getStats() {
    return {
        totalConnections: io ? io.sockets.sockets.size : 0,
        authenticatedUsers: connectedUsers.size,
        marketSubscriptions: marketSubscriptions.size,
        priceSubscriptions: priceSubscriptions.size
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
    broadcastMarketStatus,
    broadcastNewPriceSubmission,
    getStats,
    getIO
};
