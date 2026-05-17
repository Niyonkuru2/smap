// src/controllers/marketController.js
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

// ============================================
// MARKET CRUD OPERATIONS (Admin only)
// ============================================

/**
 * CREATE a new market
 * POST /api/markets
 * Admin only
 */
export const createMarket = catchAsync(async (req, res) => {
    const { id, name, province, district, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!id || !name || !province || !district) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: id, name, province, district'
        });
    }
    
    // Check if market already exists
    const existingMarket = await MarketRepository.findById(id);
    if (existingMarket) {
        return res.status(409).json({
            success: false,
            message: `Market with ID '${id}' already exists`
        });
    }
    
    // Create new market
    const newMarket = await MarketRepository.create({
        id,
        name,
        province,
        district,
        latitude: latitude || null,
        longitude: longitude || null
    });
    
    // Also add to price simulator if available
    if (priceSimulator && priceSimulator.marketFactors) {
        priceSimulator.marketFactors[id] = {
            name: name,
            province: province,
            factor: 1.0 // Default price factor
        };
    }
    
    res.status(201).json({
        success: true,
        message: 'Market created successfully',
        data: newMarket
    });
});

/**
 * UPDATE an existing market
 * PUT /api/markets/:id
 * Admin only
 */
export const updateMarket = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, province, district, latitude, longitude } = req.body;
    
    // Check if market exists
    const existingMarket = await MarketRepository.findById(id);
    if (!existingMarket) {
        return res.status(404).json({
            success: false,
            message: 'Market not found'
        });
    }
    
    // Update market
    const updatedMarket = await MarketRepository.update(id, {
        name,
        province,
        district,
        latitude,
        longitude
    });
    
    // Update price simulator if available
    if (priceSimulator && priceSimulator.marketFactors && priceSimulator.marketFactors[id]) {
        priceSimulator.marketFactors[id] = {
            ...priceSimulator.marketFactors[id],
            name: name || existingMarket.name,
            province: province || existingMarket.province
        };
    }
    
    res.json({
        success: true,
        message: 'Market updated successfully',
        data: updatedMarket
    });
});

/**
 * DELETE a market (soft delete or permanent)
 * DELETE /api/markets/:id
 * Admin only
 */
export const deleteMarket = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    // Check if market exists
    const existingMarket = await MarketRepository.findById(id);
    if (!existingMarket) {
        return res.status(404).json({
            success: false,
            message: 'Market not found'
        });
    }
    
    if (permanent === 'true') {
        // Permanent delete
        await MarketRepository.permanentDelete(id);
        
        // Remove from price simulator
        if (priceSimulator && priceSimulator.marketFactors) {
            delete priceSimulator.marketFactors[id];
        }
        
        res.json({
            success: true,
            message: 'Market permanently deleted'
        });
    } else {
        // Soft delete (deactivate)
        await MarketRepository.softDelete(id);
        
        // Mark as inactive in price simulator
        if (priceSimulator && priceSimulator.marketFactors && priceSimulator.marketFactors[id]) {
            priceSimulator.marketFactors[id].active = false;
        }
        
        res.json({
            success: true,
            message: 'Market deactivated successfully'
        });
    }
});

/**
 * BULK CREATE markets
 * POST /api/markets/bulk
 * Admin only
 */
export const bulkCreateMarkets = catchAsync(async (req, res) => {
    const { markets } = req.body;
    
    if (!markets || !Array.isArray(markets) || markets.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide an array of markets'
        });
    }
    
    const results = {
        successful: [],
        failed: []
    };
    
    for (const market of markets) {
        try {
            const { id, name, province, district, latitude, longitude } = market;
            
            if (!id || !name || !province || !district) {
                results.failed.push({
                    market,
                    error: 'Missing required fields: id, name, province, district'
                });
                continue;
            }
            
            const existingMarket = await MarketRepository.findById(id);
            if (existingMarket) {
                results.failed.push({
                    market,
                    error: `Market with ID '${id}' already exists`
                });
                continue;
            }
            
            const newMarket = await MarketRepository.create({
                id,
                name,
                province,
                district,
                latitude: latitude || null,
                longitude: longitude || null
            });
            
            results.successful.push(newMarket);
            
            // Add to price simulator
            if (priceSimulator && priceSimulator.marketFactors) {
                priceSimulator.marketFactors[id] = {
                    name: name,
                    province: province,
                    factor: 1.0
                };
            }
        } catch (error) {
            results.failed.push({
                market,
                error: error.message
            });
        }
    }
    
    res.status(201).json({
        success: true,
        message: `Successfully created ${results.successful.length} markets`,
        data: results
    });
});

/**
 * GET market statistics
 * GET /api/markets/stats
 * Admin only
 */
export const getMarketStats = catchAsync(async (req, res) => {
    const allMarkets = await MarketRepository.getAll();
    
    const stats = {
        total_markets: allMarkets.length,
        active_markets: allMarkets.filter(m => m.is_active !== false).length,
        provinces: [...new Set(allMarkets.map(m => m.province).filter(Boolean))],
        districts: [...new Set(allMarkets.map(m => m.district).filter(Boolean))],
        markets_by_province: {}
    };
    
    // Group markets by province
    allMarkets.forEach(market => {
        if (market.province) {
            if (!stats.markets_by_province[market.province]) {
                stats.markets_by_province[market.province] = [];
            }
            stats.markets_by_province[market.province].push({
                id: market.id,
                name: market.name,
                district: market.district
            });
        }
    });
    
    res.json({
        success: true,
        data: stats
    });
});

/**
 * GET markets by province
 * GET /api/markets/province/:province
 */
export const getMarketsByProvince = catchAsync(async (req, res) => {
    const { province } = req.params;
    const decodedProvince = decodeURIComponent(province);
    
    const allMarkets = await MarketRepository.getAll();
    const filteredMarkets = allMarkets.filter(m => 
        m.province && m.province.toLowerCase() === decodedProvince.toLowerCase()
    );
    
    res.json({
        success: true,
        province: decodedProvince,
        markets: filteredMarkets,
        count: filteredMarkets.length
    });
});

/**
 * SEARCH markets by name or location
 * GET /api/markets/search?q=keyword
 */
export const searchMarkets = catchAsync(async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }
    
    const allMarkets = await MarketRepository.getAll();
    const searchTerm = q.toLowerCase();
    
    const results = allMarkets.filter(market => 
        market.name.toLowerCase().includes(searchTerm) ||
        (market.district && market.district.toLowerCase().includes(searchTerm)) ||
        (market.province && market.province.toLowerCase().includes(searchTerm))
    );
    
    res.json({
        success: true,
        query: q,
        results,
        count: results.length
    });
});