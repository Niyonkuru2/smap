/**
 * Notifications Module
 * Push notifications and SMS alerts
 */

// In-memory storage for push subscriptions (use database in production)
const pushSubscriptions = new Map(); // userId -> subscription
const smsPreferences = new Map(); // userId -> { phone, alerts: [] }
const notificationQueue = [];

// Twilio configuration (set in .env)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Initialize Twilio client (lazy loading)
 */
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
            // Dynamic import would be used in production
            // twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            console.log('📱 Twilio client initialized');
        } catch (error) {
            console.warn('⚠️ Twilio not available:', error.message);
        }
    }
    return twilioClient;
}

/**
 * Register push notification subscription
 */
function registerPushSubscription(userId, subscription) {
    pushSubscriptions.set(userId, {
        subscription,
        registeredAt: new Date().toISOString(),
        active: true
    });
    
    return { 
        success: true, 
        message: 'Push notifications enabled',
        userId 
    };
}

/**
 * Unregister push subscription
 */
function unregisterPushSubscription(userId) {
    const deleted = pushSubscriptions.delete(userId);
    return { 
        success: deleted, 
        message: deleted ? 'Push notifications disabled' : 'No subscription found' 
    };
}

/**
 * Send push notification to a user
 */
async function sendPushNotification(userId, notification) {
    const subData = pushSubscriptions.get(userId);
    
    if (!subData || !subData.active) {
        return { success: false, error: 'No active subscription' };
    }
    
    const payload = {
        title: notification.title || 'Market Price Alert',
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: {
            url: notification.url || '/',
            ...notification.data
        },
        timestamp: Date.now()
    };
    
    // In production, use web-push library
    // await webpush.sendNotification(subData.subscription, JSON.stringify(payload));
    
    // For now, log and queue
    console.log(`📢 Push notification queued for user ${userId}:`, payload.title);
    notificationQueue.push({
        type: 'push',
        userId,
        payload,
        timestamp: new Date().toISOString(),
        status: 'queued'
    });
    
    return { success: true, message: 'Notification queued' };
}

/**
 * Register SMS preferences
 */
function registerSMSPreferences(userId, phone, alertTypes = ['price_drop', 'price_alert']) {
    if (!phone || !phone.match(/^\+?[0-9]{10,15}$/)) {
        return { success: false, error: 'Invalid phone number format' };
    }
    
    smsPreferences.set(userId, {
        phone,
        alerts: alertTypes,
        registeredAt: new Date().toISOString(),
        active: true,
        messagesThisMonth: 0,
        lastMessage: null
    });
    
    return {
        success: true,
        message: 'SMS alerts enabled',
        phone: phone.replace(/(.{3}).*(.{4})$/, '$1****$2'),
        alerts: alertTypes
    };
}

/**
 * Send SMS notification
 */
async function sendSMS(userId, message) {
    const prefs = smsPreferences.get(userId);
    
    if (!prefs || !prefs.active) {
        return { success: false, error: 'SMS not enabled for this user' };
    }
    
    // Rate limiting: max 10 SMS per day
    const today = new Date().toDateString();
    if (prefs.lastMessageDate === today && prefs.messagesThisMonth >= 10) {
        return { success: false, error: 'Daily SMS limit reached' };
    }
    
    const client = getTwilioClient();
    
    if (client && TWILIO_PHONE_NUMBER) {
        try {
            // In production:
            // await client.messages.create({
            //     body: message,
            //     from: TWILIO_PHONE_NUMBER,
            //     to: prefs.phone
            // });
            
            console.log(`📱 SMS would be sent to ${prefs.phone}: ${message}`);
        } catch (error) {
            console.error('SMS error:', error);
            return { success: false, error: 'Failed to send SMS' };
        }
    }
    
    // Update stats
    prefs.messagesThisMonth++;
    prefs.lastMessage = new Date().toISOString();
    prefs.lastMessageDate = today;
    smsPreferences.set(userId, prefs);
    
    // Queue for logging
    notificationQueue.push({
        type: 'sms',
        userId,
        phone: prefs.phone,
        message,
        timestamp: new Date().toISOString(),
        status: client ? 'sent' : 'simulated'
    });
    
    return { success: true, message: 'SMS sent' };
}

/**
 * Price drop alert
 */
async function sendPriceDropAlert(userId, product, oldPrice, newPrice, market) {
    const dropPercent = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
    
    const notification = {
        title: `💰 Price Drop: ${product}`,
        body: `${product} dropped ${dropPercent}% at ${market}! Now ${newPrice} RWF (was ${oldPrice} RWF)`,
        data: {
            type: 'price_drop',
            product,
            oldPrice,
            newPrice,
            market
        }
    };
    
    // Send push notification
    await sendPushNotification(userId, notification);
    
    // Check if user wants SMS for price drops
    const smsPrefs = smsPreferences.get(userId);
    if (smsPrefs?.alerts.includes('price_drop') && parseFloat(dropPercent) >= 10) {
        await sendSMS(userId, `Rwanda Market: ${product} price dropped ${dropPercent}% at ${market}! Now ${newPrice} RWF`);
    }
    
    return { success: true, notificationType: 'price_drop' };
}

/**
 * Price target reached alert
 */
async function sendPriceTargetAlert(userId, product, currentPrice, targetPrice, market) {
    const notification = {
        title: `🎯 Target Price Reached: ${product}`,
        body: `${product} is now ${currentPrice} RWF at ${market} - below your target of ${targetPrice} RWF!`,
        data: {
            type: 'price_target',
            product,
            currentPrice,
            targetPrice,
            market
        }
    };
    
    await sendPushNotification(userId, notification);
    
    const smsPrefs = smsPreferences.get(userId);
    if (smsPrefs?.alerts.includes('price_alert')) {
        await sendSMS(userId, `Rwanda Market: ${product} reached your target price! Now ${currentPrice} RWF at ${market}`);
    }
    
    return { success: true, notificationType: 'price_target' };
}

/**
 * Vendor submission status notification
 */
async function sendSubmissionStatusNotification(userId, productName, status, reason = null) {
    const statusEmoji = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
    
    const notification = {
        title: `${statusEmoji} Submission ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: `Your price for ${productName} has been ${status}${reason ? `: ${reason}` : '.'}`,
        data: {
            type: 'submission_status',
            productName,
            status,
            reason
        }
    };
    
    return await sendPushNotification(userId, notification);
}

/**
 * Get notification queue (for debugging/admin)
 */
function getNotificationQueue(limit = 50) {
    return notificationQueue.slice(-limit).reverse();
}

/**
 * Get user notification preferences
 */
function getUserNotificationPrefs(userId) {
    return {
        push: pushSubscriptions.has(userId),
        pushActive: pushSubscriptions.get(userId)?.active || false,
        sms: smsPreferences.has(userId),
        smsActive: smsPreferences.get(userId)?.active || false,
        smsAlerts: smsPreferences.get(userId)?.alerts || []
    };
}

/**
 * Update notification preferences
 */
function updateNotificationPrefs(userId, prefs) {
    if (prefs.pushActive !== undefined) {
        const pushData = pushSubscriptions.get(userId);
        if (pushData) {
            pushData.active = prefs.pushActive;
            pushSubscriptions.set(userId, pushData);
        }
    }
    
    if (prefs.smsActive !== undefined) {
        const smsData = smsPreferences.get(userId);
        if (smsData) {
            smsData.active = prefs.smsActive;
            smsPreferences.set(userId, smsData);
        }
    }
    
    if (prefs.smsAlerts && Array.isArray(prefs.smsAlerts)) {
        const smsData = smsPreferences.get(userId);
        if (smsData) {
            smsData.alerts = prefs.smsAlerts;
            smsPreferences.set(userId, smsData);
        }
    }
    
    return { success: true, preferences: getUserNotificationPrefs(userId) };
}

/**
 * Get notification stats
 */
function getNotificationStats() {
    return {
        pushSubscriptions: pushSubscriptions.size,
        smsSubscriptions: smsPreferences.size,
        queuedNotifications: notificationQueue.length,
        twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
    };
}

export {
    registerPushSubscription,
    unregisterPushSubscription,
    sendPushNotification,
    registerSMSPreferences,
    sendSMS,
    sendPriceDropAlert,
    sendPriceTargetAlert,
    sendSubmissionStatusNotification,
    getNotificationQueue,
    getUserNotificationPrefs,
    updateNotificationPrefs,
    getNotificationStats
};
