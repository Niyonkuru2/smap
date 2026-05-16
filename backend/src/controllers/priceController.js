// src/controllers/priceController.js
import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';
import PriceRepository from '../repositories/PriceRepository.js';
import * as mlPrediction from '../services/MLPredictionService.js';
import * as priceHistory from '../services/priceHistory.js';

// ============================================
// PUBLIC ENDPOINTS
// ============================================

export const getPrices = catchAsync(async (req, res) => {
    const filters = { 
        status: 'approved'
    };
    
    if (req.query.marketId) filters.market_id = req.query.marketId;
    if (req.query.productId) filters.product_id = req.query.productId;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    const prices = await PriceRepository.getAll(filters);
    res.json({ success: true, prices });
});

export const getLatestPrices = catchAsync(async (req, res) => {
    const { limit = 50 } = req.query;
    const prices = await PriceRepository.getLatestApproved(parseInt(limit));
    res.json({ success: true, prices });
});

export const getTrendingProducts = catchAsync(async (req, res) => {
    const trending = await PriceRepository.getTrendingProducts();
    res.json({ success: true, trending });
});

export const getPriceHistory = catchAsync(async (req, res) => {
    const { productId, marketId } = req.params;
    const { days = 30, limit = 100 } = req.query;
    
    const history = priceHistory.getHistory(productId, marketId, { days, limit });
    const trend = priceHistory.calculateTrend(productId, marketId, 7);
    
    res.json({ success: true, history, trend });
});

export const getPriceForecast = catchAsync(async (req, res) => {
    const { productId, marketId } = req.params;
    const { days = 7 } = req.query;
    
    const forecast = await mlPrediction.forecastPrice(productId, marketId, days);
    res.json(forecast);
});

export const compareMarkets = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const comparison = await mlPrediction.compareMarketPrices(productId);
    res.json(comparison);
});

export const getBestTimeToBuy = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const analysis = await mlPrediction.getBestTimeToBuy(productId);
    res.json(analysis);
});

// ============================================
// VENDOR ENDPOINTS
// ============================================

export const getMySubmissions = catchAsync(async (req, res) => {
    const query = `
        SELECT 
            p.id,
            p.product_id,
            p.market_id,
            p.vendor_id,
            p.price,
            p.unit,
            p.vendor_notes,
            p.status,
            p.flagged,
            p.flag_reason,
            p.created_at,
            p.updated_at,
            pr.name as product_name,
            m.name as market_name
        FROM prices p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN markets m ON p.market_id = m.id
        WHERE p.vendor_id = $1
        ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({ 
        success: true, 
        submissions: result.rows 
    });
});

export const getMyStats = catchAsync(async (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_submissions,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
            COUNT(*) FILTER (WHERE flagged = true) as flagged_submissions,
            COALESCE(AVG(price), 0) as average_price,
            COALESCE(SUM(price), 0) as total_contribution
        FROM prices
        WHERE vendor_id = $1
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({ 
        success: true, 
        data: result.rows[0] || {
            total_submissions: 0,
            approved_submissions: 0,
            pending_submissions: 0,
            rejected_submissions: 0,
            flagged_submissions: 0,
            average_price: 0,
            total_contribution: 0
        }
    });
});

export const submitPrice = catchAsync(async (req, res) => {
    const { productId, marketId, price, unit, notes } = req.body;
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
        // Check reference price first
        const refPriceQuery = `
            SELECT 
                rp.id as reference_price_id,
                rp.price as reference_price,
                rp.unit as reference_unit
            FROM reference_prices rp
            WHERE rp.product_id = $1
                AND rp.market_id = $2
                AND rp.is_current = TRUE
                AND (rp.expiry_date IS NULL OR rp.expiry_date >= CURRENT_DATE)
            ORDER BY rp.effective_date DESC
            LIMIT 1
        `;
        
        const refResult = await pool.query(refPriceQuery, [parseInt(productId), marketId]);
        const referencePrice = refResult.rows[0];
        
        // Calculate deviation if reference exists
        let deviation_pct = null;
        let isAnomaly = false;
        let anomalySeverity = null;
        let anomalyType = null;
        
        if (referencePrice) {
            deviation_pct = Math.abs(((price - referencePrice.reference_price) / referencePrice.reference_price) * 100);
            
            if (deviation_pct > 30) {
                isAnomaly = true;
                anomalySeverity = deviation_pct > 50 ? 'critical' : 'high';
                anomalyType = price > referencePrice.reference_price ? 'price_spike' : 'price_drop';
            } else if (deviation_pct > 15) {
                isAnomaly = true;
                anomalySeverity = 'medium';
                anomalyType = price > referencePrice.reference_price ? 'price_spike' : 'price_drop';
            } else if (deviation_pct > 5) {
                isAnomaly = true;
                anomalySeverity = 'low';
                anomalyType = price > referencePrice.reference_price ? 'price_spike' : 'price_drop';
            }
        }
        
        // Insert the price
        const insertQuery = `
            INSERT INTO prices (
                product_id, 
                market_id, 
                vendor_id, 
                price, 
                unit, 
                vendor_notes, 
                status, 
                flagged, 
                flag_reason,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING *
        `;
        
        const values = [
            parseInt(productId),
            marketId,
            req.user.id,
            price,
            unit || 'kg',
            notes || null,
            isAnomaly && anomalySeverity !== 'low' ? 'flagged' : 'pending',
            isAnomaly,
            isAnomaly ? `Price deviates by ${deviation_pct.toFixed(1)}% from reference price` : null
        ];
        
        const result = await pool.query(insertQuery, values);
        const submission = result.rows[0];
        
        // Create anomaly record if needed
        let anomaly = null;
        if (isAnomaly && referencePrice) {
            const anomalyInsert = `
                INSERT INTO price_anomalies (
                    price_id,
                    product_id,
                    market_id,
                    vendor_id,
                    reference_price_id,
                    reference_price,
                    vendor_price,
                    price_difference,
                    deviation_percentage,
                    anomaly_type,
                    severity,
                    status,
                    details,
                    auto_flagged,
                    flag_reason
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new', $12, true, $13)
                RETURNING *
            `;
            
            const anomalyValues = [
                submission.id,
                parseInt(productId),
                marketId,
                req.user.id,
                referencePrice.reference_price_id,
                referencePrice.reference_price,
                price,
                price - referencePrice.reference_price,
                deviation_pct,
                anomalyType,
                anomalySeverity,
                `Price is ${deviation_pct.toFixed(1)}% ${price > referencePrice.reference_price ? 'above' : 'below'} reference price of ${referencePrice.reference_price} RWF`,
                `Auto-detected anomaly: ${anomalySeverity} deviation`
            ];
            
            const anomalyResult = await pool.query(anomalyInsert, anomalyValues);
            anomaly = anomalyResult.rows[0];
        }
        
        // Record in price change history
        const historyQuery = `
            INSERT INTO price_change_history (
                price_id, product_id, market_id, new_price, 
                change_type, recorded_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        
        await pool.query(historyQuery, [
            submission.id,
            parseInt(productId),
            marketId,
            price,
            'new'
        ]);
        
        await pool.query('COMMIT');
        
        // Prepare response
        let responseMessage = '✓ Price submitted successfully';
        let anomalyInfo = null;
        
        if (anomaly) {
            if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
                responseMessage = '⚠️ Price flagged for immediate review due to significant deviation';
                anomalyInfo = {
                    isAnomaly: true,
                    severity: anomaly.severity,
                    type: anomaly.anomaly_type,
                    deviation: parseFloat(anomaly.deviation_percentage),
                    details: anomaly.details,
                    referencePrice: parseFloat(anomaly.reference_price),
                    vendorPrice: parseFloat(anomaly.vendor_price),
                    reason: anomaly.details
                };
            } else {
                responseMessage = 'ℹ️ Price flagged for review (moderate deviation)';
                anomalyInfo = {
                    isAnomaly: true,
                    severity: anomaly.severity,
                    type: anomaly.anomaly_type,
                    deviation: parseFloat(anomaly.deviation_percentage),
                    details: anomaly.details,
                    reason: anomaly.details
                };
            }
        } else {
            responseMessage = '✓ Price automatically approved - within normal range';
        }
        
        res.status(201).json({
            success: true,
            submission: {
                id: submission.id,
                product_id: submission.product_id,
                market_id: submission.market_id,
                vendor_id: submission.vendor_id,
                price: parseFloat(submission.price),
                unit: submission.unit,
                vendor_notes: submission.vendor_notes,
                status: submission.status,
                flagged: submission.flagged,
                flag_reason: submission.flag_reason,
                created_at: submission.created_at
            },
            anomalyCheck: anomalyInfo,
            message: responseMessage
        });
        
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error in submitPrice:', error);
        throw error;
    }
});

export const updateMySubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { price, notes } = req.body;
    
    const submission = await PriceRepository.getById(id);
    
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    if (submission.vendor_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this submission' });
    }
    
    if (submission.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Can only update pending submissions' });
    }
    
    const updated = await PriceRepository.update(id, {
        price,
        vendor_notes: notes,
        updated_at: new Date()
    });
    
    res.json({ success: true, submission: updated, message: 'Submission updated successfully' });
});

export const deleteMySubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const submission = await PriceRepository.getById(id);
    
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    if (submission.vendor_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this submission' });
    }
    
    if (submission.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Can only delete pending submissions' });
    }
    
    await PriceRepository.delete(id);
    
    res.json({ success: true, message: 'Submission deleted successfully' });
});

export const getRecommendations = catchAsync(async (req, res) => {
    const recommendations = await mlPrediction.getShoppingRecommendations(req.user.id);
    res.json(recommendations);
});

// ============================================
// LIVE PRICES ENDPOINT
// ============================================

export const getLivePrices = catchAsync(async (req, res) => {
    const { marketId, productId, limit = 50 } = req.query;
    
    let query = `
        SELECT 
            p.id,
            p.product_id,
            p.market_id,
            p.price,
            p.unit,
            p.vendor_notes,
            p.created_at,
            pr.name as product_name,
            pr.unit as product_unit,
            m.name as market_name,
            m.province,
            m.district
        FROM prices p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN markets m ON p.market_id = m.id
        WHERE p.status = 'approved'
        AND p.flagged = false
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (marketId) {
        query += ` AND p.market_id = $${paramIndex}`;
        params.push(marketId);
        paramIndex++;
    }
    
    if (productId) {
        query += ` AND p.product_id = $${paramIndex}`;
        params.push(parseInt(productId));
        paramIndex++;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get distinct latest prices per product-market combination
    const latestPrices = {};
    for (const price of result.rows) {
        const key = `${price.product_id}-${price.market_id}`;
        if (!latestPrices[key]) {
            latestPrices[key] = {
                id: price.id,
                product_id: price.product_id,
                product_name: price.product_name,
                product_unit: price.product_unit,
                market_id: price.market_id,
                market_name: price.market_name,
                province: price.province,
                district: price.district,
                price: parseFloat(price.price),
                unit: price.unit,
                vendor_notes: price.vendor_notes,
                created_at: price.created_at
            };
        }
    }
    
    res.json({ 
        success: true,
        prices: Object.values(latestPrices),
        count: Object.values(latestPrices).length
    });
});

// ============================================
// VENDOR STATISTICS ENDPOINT
// ============================================

/**
 * Get vendor price statistics (for vendor profile or admin)
 */
export const getVendorStats = catchAsync(async (req, res) => {
    const { vendorId } = req.params;
    
    const query = `
        SELECT 
            COUNT(*) as total_submissions,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
            COUNT(*) FILTER (WHERE flagged = true) as flagged_submissions,
            COALESCE(AVG(price), 0) as average_price,
            COALESCE(SUM(price), 0) as total_contribution
        FROM prices
        WHERE vendor_id = $1
    `;
    
    const result = await pool.query(query, [parseInt(vendorId)]);
    
    res.json({ 
        success: true, 
        data: result.rows[0] || {
            total_submissions: 0,
            approved_submissions: 0,
            pending_submissions: 0,
            rejected_submissions: 0,
            flagged_submissions: 0,
            average_price: 0,
            total_contribution: 0
        }
    });
});

// ============================================
// ADMIN PRICE MANAGEMENT ENDPOINTS
// ============================================

/**
 * Get all pending price submissions (Admin only)
 */
export const getPendingSubmissions = catchAsync(async (req, res) => {
    const query = `
        SELECT 
            p.id,
            p.product_id,
            p.market_id,
            p.vendor_id,
            p.price,
            p.unit,
            p.vendor_notes,
            p.status,
            p.flagged,
            p.flag_reason,
            p.created_at,
            pr.name as product_name,
            m.name as market_name,
            u.name as vendor_name,
            u.email as vendor_email
        FROM prices p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN markets m ON p.market_id = m.id
        LEFT JOIN users u ON p.vendor_id = u.id
        WHERE p.status = 'pending'
        ORDER BY 
            CASE WHEN p.flagged = true THEN 1 ELSE 2 END,
            p.created_at ASC
        LIMIT $1
        OFFSET $2
    `;
    
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(query, [parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await pool.query(
        'SELECT COUNT(*) FROM prices WHERE status = $1',
        ['pending']
    );
    
    res.json({
        success: true,
        submissions: result.rows,
        pagination: {
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        }
    });
});

/**
 * Approve a price submission (Admin only)
 */
export const approvePrice = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const query = `
        UPDATE prices 
        SET 
            status = 'approved',
            approved_by = $1,
            approved_at = NOW(),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = NOW()
        WHERE id = $3
        AND status = 'pending'
        RETURNING *
    `;
    
    const result = await pool.query(query, [req.user.id, adminNotes, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Price submission not found or already processed' 
        });
    }
    
    res.json({
        success: true,
        submission: result.rows[0],
        message: 'Price approved successfully'
    });
});

/**
 * Reject a price submission (Admin only)
 */
export const rejectPrice = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
        return res.status(400).json({ 
            success: false, 
            message: 'Rejection reason is required' 
        });
    }
    
    const query = `
        UPDATE prices 
        SET 
            status = 'rejected',
            rejected_by = $1,
            rejected_at = NOW(),
            rejection_reason = $2,
            updated_at = NOW()
        WHERE id = $3
        AND status = 'pending'
        RETURNING *
    `;
    
    const result = await pool.query(query, [req.user.id, rejectionReason, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Price submission not found or already processed' 
        });
    }
    
    res.json({
        success: true,
        submission: result.rows[0],
        message: 'Price rejected successfully'
    });
});