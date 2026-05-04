/**
 * Payment Integration Module - Backend
 * MTN Mobile Money, Airtel Money, and card payments
 */

import { db } from './database.js';

// Initialize payment tables
export async function initializePaymentTables() {
    await db.query(`
        -- Payment transactions
        CREATE TABLE IF NOT EXISTS payment_transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'deposit', 'withdrawal'
            amount DECIMAL(12,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'RWF',
            payment_method VARCHAR(50) NOT NULL, -- 'mtn_momo', 'airtel_money', 'card', 'cash'
            phone_number VARCHAR(50),
            external_ref VARCHAR(255),
            internal_ref VARCHAR(100) UNIQUE,
            status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
            error_message TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        );

        -- User wallets/balances
        CREATE TABLE IF NOT EXISTS user_wallets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            balance DECIMAL(12,2) DEFAULT 0,
            pending_balance DECIMAL(12,2) DEFAULT 0,
            total_earned DECIMAL(12,2) DEFAULT 0,
            total_spent DECIMAL(12,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Price lock/reservations
        CREATE TABLE IF NOT EXISTS price_locks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            locked_price DECIMAL(10,2) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            total_amount DECIMAL(12,2) NOT NULL,
            deposit_amount DECIMAL(12,2),
            transaction_id INTEGER REFERENCES payment_transactions(id),
            status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_ref ON payment_transactions(internal_ref);
        CREATE INDEX IF NOT EXISTS idx_price_locks_user ON price_locks(user_id);
    `);
}

// Generate unique transaction reference
function generateTransactionRef() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`.toUpperCase();
}

// ============ MTN Mobile Money Integration ============

// MTN MoMo API configuration (sandbox for development)
const MTN_MOMO_CONFIG = {
    baseUrl: process.env.MTN_MOMO_URL || 'https://sandbox.momodeveloper.mtn.com',
    subscriptionKey: process.env.MTN_MOMO_API_KEY || '',
    apiUserId: process.env.MTN_MOMO_USER_ID || '',
    apiKey: process.env.MTN_MOMO_API_SECRET || '',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
};

export async function initiateMTNPayment(userId, amount, phoneNumber, description = 'Market purchase') {
    const internalRef = generateTransactionRef();
    
    // Create transaction record
    const transaction = await db.query(
        `INSERT INTO payment_transactions 
         (user_id, transaction_type, amount, payment_method, phone_number, internal_ref, status, metadata)
         VALUES ($1, 'payment', $2, 'mtn_momo', $3, $4, 'pending', $5)
         RETURNING *`,
        [userId, amount, phoneNumber, internalRef, JSON.stringify({ description })]
    );

    try {
        // TODO: Implement MTN MoMo API integration (requires API credentials from MTN)
        // For now, record transaction as processing
        
        // Update status to processing
        await db.query(
            `UPDATE payment_transactions SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [transaction.rows[0].id]
        );

        return {
            success: true,
            transactionId: transaction.rows[0].id,
            reference: internalRef,
            status: 'processing',
            message: 'Payment request sent. Please approve on your phone.'
        };
    } catch (error) {
        await db.query(
            `UPDATE payment_transactions SET status = 'failed', error_message = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [transaction.rows[0].id, error.message]
        );
        throw error;
    }
}

// ============ Airtel Money Integration ============

const AIRTEL_CONFIG = {
    baseUrl: process.env.AIRTEL_MONEY_URL || 'https://openapi.airtel.africa',
    clientId: process.env.AIRTEL_CLIENT_ID || '',
    clientSecret: process.env.AIRTEL_CLIENT_SECRET || ''
};

export async function initiateAirtelPayment(userId, amount, phoneNumber, description = 'Market purchase') {
    const internalRef = generateTransactionRef();
    
    const transaction = await db.query(
        `INSERT INTO payment_transactions 
         (user_id, transaction_type, amount, payment_method, phone_number, internal_ref, status, metadata)
         VALUES ($1, 'payment', $2, 'airtel_money', $3, $4, 'pending', $5)
         RETURNING *`,
        [userId, amount, phoneNumber, internalRef, JSON.stringify({ description })]
    );

    try {
        // TODO: Implement Airtel Money API integration (requires API credentials)
        // For now, record transaction as processing
        
        await db.query(
            `UPDATE payment_transactions SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [transaction.rows[0].id]
        );

        return {
            success: true,
            transactionId: transaction.rows[0].id,
            reference: internalRef,
            status: 'processing',
            message: 'Payment request sent. Please approve on your phone.'
        };
    } catch (error) {
        await db.query(
            `UPDATE payment_transactions SET status = 'failed', error_message = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [transaction.rows[0].id, error.message]
        );
        throw error;
    }
}

// ============ Payment Status & Management ============

export async function checkPaymentStatus(transactionId) {
    const result = await db.query(
        `SELECT * FROM payment_transactions WHERE id = $1`,
        [transactionId]
    );

    if (!result.rows[0]) {
        return { success: false, error: 'Transaction not found' };
    }

    const transaction = result.rows[0];

    // TODO: Integrate with payment provider to check actual status
    if (transaction.status === 'processing') {
        const newStatus = isSuccessful ? 'completed' : 'failed';
        
        await db.query(
            `UPDATE payment_transactions SET 
                status = $2, 
                completed_at = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
                error_message = CASE WHEN $2 = 'failed' THEN 'Payment declined by user' ELSE NULL END,
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [transactionId, newStatus]
        );

        // Update wallet if successful
        if (isSuccessful && transaction.user_id) {
            await updateWalletBalance(transaction.user_id, transaction.amount, 'debit');
        }

        transaction.status = newStatus;
    }

    return {
        success: true,
        transaction: {
            id: transaction.id,
            reference: transaction.internal_ref,
            amount: transaction.amount,
            status: transaction.status,
            paymentMethod: transaction.payment_method,
            createdAt: transaction.created_at,
            completedAt: transaction.completed_at
        }
    };
}

export async function getTransactionHistory(userId, options = {}) {
    const { limit = 20, offset = 0, status, type } = options;
    
    let query = `
        SELECT * FROM payment_transactions 
        WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }

    if (type) {
        paramCount++;
        query += ` AND transaction_type = $${paramCount}`;
        params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
}

// ============ Wallet Management ============

export async function getWallet(userId) {
    let result = await db.query(
        'SELECT * FROM user_wallets WHERE user_id = $1',
        [userId]
    );

    // Create wallet if doesn't exist
    if (!result.rows[0]) {
        result = await db.query(
            `INSERT INTO user_wallets (user_id) VALUES ($1) RETURNING *`,
            [userId]
        );
    }

    return result.rows[0];
}

export async function updateWalletBalance(userId, amount, type = 'credit') {
    const field = type === 'credit' ? 'balance' : 'balance';
    const operator = type === 'credit' ? '+' : '-';
    const totalField = type === 'credit' ? 'total_earned' : 'total_spent';

    await db.query(`
        INSERT INTO user_wallets (user_id, balance, ${totalField})
        VALUES ($1, $2, $2)
        ON CONFLICT (user_id) DO UPDATE SET
            balance = user_wallets.balance ${operator} $2,
            ${totalField} = user_wallets.${totalField} + $2,
            updated_at = CURRENT_TIMESTAMP
    `, [userId, Math.abs(amount)]);

    return getWallet(userId);
}

// ============ Price Lock (Pre-order at current price) ============

export async function createPriceLock(userId, vendorId, productId, quantity, lockedPrice, depositPercent = 20) {
    const totalAmount = quantity * lockedPrice;
    const depositAmount = totalAmount * (depositPercent / 100);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await db.query(
        `INSERT INTO price_locks 
         (user_id, vendor_id, product_id, locked_price, quantity, total_amount, deposit_amount, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, vendorId, productId, lockedPrice, quantity, totalAmount, depositAmount, expiresAt]
    );

    return {
        success: true,
        priceLock: result.rows[0],
        depositRequired: depositAmount,
        expiresAt
    };
}

export async function confirmPriceLock(priceLockId, transactionId) {
    const result = await db.query(
        `UPDATE price_locks SET 
            transaction_id = $2, 
            status = 'active' 
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [priceLockId, transactionId]
    );

    return result.rows[0];
}

export async function getPriceLocks(userId, status = null) {
    let query = `
        SELECT pl.*, p.name as product_name, u.name as vendor_name, m.name as market_name
        FROM price_locks pl
        JOIN products p ON pl.product_id = p.id
        JOIN users u ON pl.vendor_id = u.id
        LEFT JOIN markets m ON u.market_id = m.id
        WHERE pl.user_id = $1
    `;
    const params = [userId];

    if (status) {
        query += ` AND pl.status = $2`;
        params.push(status);
    }

    query += ' ORDER BY pl.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
}

// ============ API Routes ============

export function setupPaymentRoutes(app, authMiddleware) {
    // Initiate payment
    app.post('/api/payments/initiate', authMiddleware, async (req, res) => {
        try {
            const { amount, phoneNumber, method, description } = req.body;

            if (!amount || !phoneNumber || !method) {
                return res.status(400).json({ error: 'Amount, phone number, and method required' });
            }

            let result;
            switch (method) {
                case 'mtn_momo':
                    result = await initiateMTNPayment(req.user.id, amount, phoneNumber, description);
                    break;
                case 'airtel_money':
                    result = await initiateAirtelPayment(req.user.id, amount, phoneNumber, description);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid payment method' });
            }

            res.json(result);
        } catch (error) {
            console.error('Payment initiation error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Check payment status
    app.get('/api/payments/:transactionId/status', authMiddleware, async (req, res) => {
        try {
            const result = await checkPaymentStatus(req.params.transactionId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Transaction history
    app.get('/api/payments/history', authMiddleware, async (req, res) => {
        try {
            const transactions = await getTransactionHistory(req.user.id, req.query);
            res.json({ success: true, transactions });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Wallet
    app.get('/api/wallet', authMiddleware, async (req, res) => {
        try {
            const wallet = await getWallet(req.user.id);
            res.json({ success: true, wallet });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Create price lock
    app.post('/api/price-lock', authMiddleware, async (req, res) => {
        try {
            const { vendorId, productId, quantity, lockedPrice, depositPercent } = req.body;
            const result = await createPriceLock(
                req.user.id, vendorId, productId, quantity, lockedPrice, depositPercent
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get price locks
    app.get('/api/price-locks', authMiddleware, async (req, res) => {
        try {
            const locks = await getPriceLocks(req.user.id, req.query.status);
            res.json({ success: true, priceLocks: locks });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Payment webhook (for production callbacks)
    app.post('/api/payments/webhook/:provider', async (req, res) => {
        try {
            const { provider } = req.params;
            const payload = req.body;

            console.log(`Payment webhook received from ${provider}:`, payload);

            // Verify webhook signature and process
            // Implementation depends on provider

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

export default {
    initializePaymentTables,
    initiateMTNPayment,
    initiateAirtelPayment,
    checkPaymentStatus,
    getTransactionHistory,
    getWallet,
    updateWalletBalance,
    createPriceLock,
    confirmPriceLock,
    getPriceLocks,
    setupPaymentRoutes
};
