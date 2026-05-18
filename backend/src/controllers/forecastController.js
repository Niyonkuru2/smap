import { catchAsync } from '../middleware/errorHandler.js';
import PriceForecastService from '../services/PriceForecastService.js';

export const getPriceForecast = catchAsync(async (req, res) => {
    const { productId, marketId } = req.params;
    const { days = 30 } = req.query;
    
    const forecast = await PriceForecastService.generateForecast(productId, marketId, parseInt(days));
    
    if (!forecast.success) {
        return res.status(404).json(forecast);
    }
    
    res.json({
        success: true,
        data: forecast
    });
});

export const getBestTimeToBuy = catchAsync(async (req, res) => {
    const { productId } = req.params;
    
    const analysis = await PriceForecastService.getBestTimeToBuy(productId);
    
    if (!analysis.success) {
        return res.status(404).json(analysis);
    }
    
    res.json({
        success: true,
        data: analysis
    });
});

export const getMarketComparison = catchAsync(async (req, res) => {
    const { productId } = req.params;
    
    const comparison = await PriceForecastService.getMarketComparison(productId);
    
    if (!comparison.success) {
        return res.status(404).json(comparison);
    }
    
    res.json({
        success: true,
        data: comparison
    });
});

export const trainModels = catchAsync(async (req, res) => {
    const result = await PriceForecastService.trainModels();
    res.json(result);
});

export const getModelMetrics = catchAsync(async (req, res) => {
    const metrics = await PriceForecastService.getModelMetrics();
    res.json({
        success: true,
        data: metrics
    });
});

export const getProductForecastSummary = catchAsync(async (req, res) => {
    const { productId } = req.params;
    
    // Get best time to buy
    const bestTime = await PriceForecastService.getBestTimeToBuy(productId);
    
    // Get market comparison
    const marketComparison = await PriceForecastService.getMarketComparison(productId);
    
    // Get 30-day forecast for best market
    let forecast = null;
    if (marketComparison.success && marketComparison.best_market) {
        forecast = await PriceForecastService.generateForecast(
            productId, 
            marketComparison.best_market.market_id, 
            30
        );
    }
    
    res.json({
        success: true,
        data: {
            best_time_to_buy: bestTime.success ? bestTime : null,
            market_comparison: marketComparison.success ? marketComparison : null,
            forecast: forecast?.success ? forecast : null
        }
    });
});