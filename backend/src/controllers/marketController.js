import { catchAsync } from '../middleware/errorHandler.js';
import MarketRepository from '../repositories/MarketRepository.js';
import priceSimulator from '../services/priceSimulator.js';

export const getMarkets = catchAsync(async (req, res) => {
    const markets = await MarketRepository.getAll();
    res.json({ success: true, markets });
});

export const getMarket = catchAsync(async (req, res) => {
    const market = await MarketRepository.findById(req.params.id);
    if (!market) {
        return res.status(404).json({ error: 'Market not found' });
    }
    res.json({ success: true, market });
});

export const getLivePrices = catchAsync(async (req, res) => {
    const prices = priceSimulator.generateMarketPrices();
    res.json({
        success: true,
        prices,
        source: 'Rwanda Market Price Network',
        updated: new Date()
    });
});

export const getMarketPrices = catchAsync(async (req, res) => {
    const marketName = decodeURIComponent(req.params.marketName);
    const prices = priceSimulator.generatePricesForMarket(marketName);
    res.json({ success: true, market: marketName, prices });
});

export const compareProductPrices = catchAsync(async (req, res) => {
    const productName = decodeURIComponent(req.params.productName);
    const comparison = priceSimulator.compareProductPrices(productName);
    const cheapest = priceSimulator.findCheapestMarkets(productName, 5);
    
    res.json({
        success: true,
        product: productName,
        comparison,
        cheapest_markets: cheapest
    });
});

export const getMarketsInfo = catchAsync(async (req, res) => {
    const markets = Object.entries(priceSimulator.marketFactors).map(([name, info]) => ({
        name,
        province: info.province,
        price_factor: info.factor,
        price_level: info.factor > 1.05 ? 'High' : info.factor < 0.95 ? 'Low' : 'Average'
    }));
    
    res.json({ success: true, markets, total: markets.length });
});