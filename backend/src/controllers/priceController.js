import { catchAsync } from '../middleware/errorHandler.js';
import PriceRepository from '../repositories/PriceRepository.js';
import * as mlPrediction from '../services/MLPredictionService.js';
import * as priceHistory from '../services/priceHistory.js';
import { sendPriceDropAlert, sendPriceTargetAlert } from '../services/notifications.js';

export const getPrices = catchAsync(async (req, res) => {
    const filters = { status: 'approved' };
    if (req.query.marketId) filters.market_id = req.query.marketId;
    if (req.query.productId) filters.product_id = req.query.productId;
    
    const prices = await PriceRepository.getAll(filters);
    res.json({ success: true, prices });
});

export const getMySubmissions = catchAsync(async (req, res) => {
    const submissions = await PriceRepository.getAll({ vendor_id: req.user.id });
    res.json({ success: true, submissions });
});

export const submitPrice = catchAsync(async (req, res) => {
    const { productId, marketId, price, unit, notes } = req.body;
    
    // Check for anomaly before submission
    const anomalyCheck = await mlPrediction.detectPriceAnomaly(productId, marketId, price);
    
    const submission = await PriceRepository.create({
        product_id: productId,
        market_id: marketId,
        vendor_id: req.user.id,
        price,
        unit: unit || 'kg',
        notes,
        status: anomalyCheck.isAnomaly ? 'flagged' : 'pending',
        flagged: anomalyCheck.isAnomaly,
        flag_reason: anomalyCheck.reason
    });
    
    // Record in price history
    priceHistory.recordPrice(productId, marketId, price, req.user.id);
    
    res.status(201).json({
        success: true,
        submission,
        anomalyCheck: anomalyCheck.isAnomaly ? anomalyCheck : null,
        message: anomalyCheck.isAnomaly 
            ? 'Price flagged for review due to unusual value'
            : 'Price submitted successfully'
    });
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

export const getRecommendations = catchAsync(async (req, res) => {
    const recommendations = await mlPrediction.getShoppingRecommendations(req.user.id);
    res.json(recommendations);
});