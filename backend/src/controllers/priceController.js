// src/controllers/priceController.js
import { catchAsync } from '../middleware/errorHandler.js';
import  pool  from '../config/database.js';
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
            p.*,
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
    const stats = await PriceRepository.getVendorStats(req.user.id);
    res.json({ success: true, stats });
});

export const submitPrice = catchAsync(async (req, res) => {
    const { productId, marketId, price, unit, notes } = req.body;
    
    let referencePrice = null;
    let anomalyCheck = { isAnomaly: false, reason: null, referencePrice: null, percentageDiff: null };
    
    try {
        const query = `
            SELECT * FROM get_current_reference_price($1, $2)
        `;
        const result = await pool.query(query, [parseInt(productId), marketId]);
        
        if (result.rows.length > 0) {
            referencePrice = parseFloat(result.rows[0].reference_price);
            const percentageDiff = ((price - referencePrice) / referencePrice) * 100;
            
            if (Math.abs(percentageDiff) > 30) {
                anomalyCheck = {
                    isAnomaly: true,
                    reason: `Price is ${percentageDiff > 0 ? 'higher' : 'lower'} by ${Math.abs(percentageDiff).toFixed(1)}% than reference price of ${referencePrice.toLocaleString()} RWF`,
                    referencePrice: referencePrice,
                    percentageDiff: percentageDiff
                };
            }
        }
    } catch (error) {
        console.error('Error fetching reference price:', error);
    }
    
    // Use vendor_notes instead of notes column
    const insertQuery = `
        INSERT INTO prices (
            product_id, market_id, vendor_id, price, unit, vendor_notes, 
            status, flagged, flag_reason, created_at
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
        anomalyCheck.isAnomaly ? 'flagged' : 'pending',
        anomalyCheck.isAnomaly,
        anomalyCheck.reason || null
    ];
    
    const result = await pool.query(insertQuery, values);
    const submission = result.rows[0];
    
    // Record in price change history
    const historyQuery = `
        INSERT INTO price_change_history (
            price_id, product_id, market_id, old_price, new_price, 
            percentage_change, change_type, recorded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    
    await pool.query(historyQuery, [
        submission.id,
        parseInt(productId),
        marketId,
        null,
        price,
        null,
        'new'
    ]);
    
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
        anomalyCheck: anomalyCheck.isAnomaly ? anomalyCheck : null,
        message: anomalyCheck.isAnomaly 
            ? 'Price flagged for review due to unusual value compared to reference price'
            : '✓ Price submitted successfully and pending approval'
    });
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


// src/controllers/priceController.js - Fix getLivePrices

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