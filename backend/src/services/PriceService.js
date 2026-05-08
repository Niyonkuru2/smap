const priceHistory = new Map();
function recordPrice(productId, marketId, price, vendorId = null, metadata = {}) {
    const key = `${productId}-${marketId}`;
    const history = priceHistory.get(key) || [];
    
    history.push({
        price: parseFloat(price),
        timestamp: new Date().toISOString(),
        vendorId,
        ...metadata
    });
    if (history.length > 1000) {
        history.shift();
    }
    
    priceHistory.set(key, history);
    return { recorded: true, totalEntries: history.length };
}

/**
 * Get price history for a product at a market
 */
function getHistory(productId, marketId, options = {}) {
    const { days = 30, limit = 100 } = options;
    const key = `${productId}-${marketId}`;
    const history = priceHistory.get(key) || [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filtered = history
        .filter(h => new Date(h.timestamp) >= cutoffDate)
        .slice(-limit);
    
    return {
        productId,
        marketId,
        entries: filtered,
        count: filtered.length,
        period: `Last ${days} days`
    };
}

/**
 * Calculate price trends
 */
function calculateTrend(productId, marketId, days = 7) {
    const key = `${productId}-${marketId}`;
    const history = priceHistory.get(key) || [];
    
    if (history.length < 2) {
        return { trend: 'stable', change: 0, confidence: 'low' };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentPrices = history.filter(h => new Date(h.timestamp) >= cutoffDate);
    
    if (recentPrices.length < 2) {
        return { trend: 'stable', change: 0, confidence: 'low' };
    }
    
    const oldPrice = recentPrices[0].price;
    const newPrice = recentPrices[recentPrices.length - 1].price;
    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    
    // Calculate average and standard deviation
    const prices = recentPrices.map(p => p.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / avg) * 100;
    
    let trend = 'stable';
    if (changePercent > 5) trend = 'rising';
    else if (changePercent < -5) trend = 'falling';
    
    return {
        trend,
        change: parseFloat(changePercent.toFixed(2)),
        changeAbsolute: parseFloat((newPrice - oldPrice).toFixed(2)),
        oldPrice,
        newPrice,
        average: parseFloat(avg.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        dataPoints: recentPrices.length,
        confidence: recentPrices.length > 10 ? 'high' : recentPrices.length > 5 ? 'medium' : 'low',
        period: `${days} days`
    };
}

/**
 * Price forecasting using simple moving average and trend analysis
 */
function forecastPrice(productId, marketId, daysAhead = 7) {
    const key = `${productId}-${marketId}`;
    const history = priceHistory.get(key) || [];
    
    if (history.length < 10) {
        return { 
            forecast: null, 
            confidence: 'insufficient_data',
            message: 'Need at least 10 data points for forecasting'
        };
    }
    
    const prices = history.slice(-30).map(h => h.price);
    
    // Simple Moving Average (SMA)
    const sma7 = prices.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, prices.length);
    const sma14 = prices.slice(-14).reduce((a, b) => a + b, 0) / Math.min(14, prices.length);
    
    // Calculate trend direction
    const trendStrength = (sma7 - sma14) / sma14;
    
    // Exponential smoothing factor
    const alpha = 0.3;
    let forecast = prices[prices.length - 1];
    
    for (let i = 0; i < daysAhead; i++) {
        forecast = forecast * (1 + trendStrength * alpha);
    }
    
    // Calculate confidence interval
    const stdDev = Math.sqrt(
        prices.reduce((sum, p) => sum + Math.pow(p - sma7, 2), 0) / prices.length
    );
    
    const confidenceInterval = {
        low: parseFloat((forecast - 1.96 * stdDev).toFixed(2)),
        high: parseFloat((forecast + 1.96 * stdDev).toFixed(2))
    };
    
    return {
        currentPrice: prices[prices.length - 1],
        forecast: parseFloat(forecast.toFixed(2)),
        daysAhead,
        confidenceInterval,
        trend: trendStrength > 0.01 ? 'upward' : trendStrength < -0.01 ? 'downward' : 'stable',
        trendStrength: parseFloat((trendStrength * 100).toFixed(2)),
        confidence: history.length > 50 ? 'high' : history.length > 20 ? 'medium' : 'low',
        method: 'Exponential Smoothing with Trend',
        disclaimer: 'Forecasts are estimates based on historical data and may not reflect actual future prices'
    };
}

/**
 * Seasonal price analysis
 */
function getSeasonalAnalysis(productId, marketId) {
    const key = `${productId}-${marketId}`;
    const history = priceHistory.get(key) || [];
    
    if (history.length < 30) {
        return { 
            analysis: null, 
            message: 'Need at least 30 data points for seasonal analysis' 
        };
    }
    
    // Group prices by month
    const monthlyData = {};
    const dayOfWeekData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    history.forEach(h => {
        const date = new Date(h.timestamp);
        const month = date.getMonth();
        const dayOfWeek = date.getDay();
        
        if (!monthlyData[month]) monthlyData[month] = [];
        monthlyData[month].push(h.price);
        dayOfWeekData[dayOfWeek].push(h.price);
    });
    
    // Calculate monthly averages
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAverages = {};
    let highestMonth = { month: null, avg: 0 };
    let lowestMonth = { month: null, avg: Infinity };
    
    Object.keys(monthlyData).forEach(month => {
        const avg = monthlyData[month].reduce((a, b) => a + b, 0) / monthlyData[month].length;
        monthlyAverages[monthNames[month]] = parseFloat(avg.toFixed(2));
        
        if (avg > highestMonth.avg) {
            highestMonth = { month: monthNames[month], avg };
        }
        if (avg < lowestMonth.avg) {
            lowestMonth = { month: monthNames[month], avg };
        }
    });
    
    // Calculate day of week averages
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekAverages = {};
    
    Object.keys(dayOfWeekData).forEach(day => {
        if (dayOfWeekData[day].length > 0) {
            dayOfWeekAverages[dayNames[day]] = parseFloat(
                (dayOfWeekData[day].reduce((a, b) => a + b, 0) / dayOfWeekData[day].length).toFixed(2)
            );
        }
    });
    
    return {
        productId,
        marketId,
        monthlyAverages,
        dayOfWeekAverages,
        insights: {
            highestPriceMonth: highestMonth.month,
            lowestPriceMonth: lowestMonth.month,
            seasonalVariation: parseFloat(((highestMonth.avg - lowestMonth.avg) / lowestMonth.avg * 100).toFixed(2)),
            bestBuyingTime: lowestMonth.month ? `${lowestMonth.month} typically has the lowest prices` : 'Not enough data'
        },
        dataPoints: history.length
    };
}

/**
 * Get market comparison report
 */
function getMarketComparisonReport(productId, markets) {
    const comparisons = [];
    
    markets.forEach(marketId => {
        const key = `${productId}-${marketId}`;
        const history = priceHistory.get(key) || [];
        
        if (history.length > 0) {
            const prices = history.map(h => h.price);
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const latest = prices[prices.length - 1];
            const trend = calculateTrend(productId, marketId, 7);
            
            comparisons.push({
                marketId,
                averagePrice: parseFloat(avg.toFixed(2)),
                minPrice: min,
                maxPrice: max,
                latestPrice: latest,
                priceRange: max - min,
                dataPoints: history.length,
                trend: trend.trend,
                trendChange: trend.change
            });
        }
    });
    
    // Sort by average price
    comparisons.sort((a, b) => a.averagePrice - b.averagePrice);
    
    // Add ranking
    comparisons.forEach((c, i) => {
        c.rank = i + 1;
        c.isCheapest = i === 0;
    });
    
    const cheapestMarket = comparisons[0];
    const expensiveMarket = comparisons[comparisons.length - 1];
    
    return {
        productId,
        marketsCompared: comparisons.length,
        comparisons,
        summary: {
            cheapestMarket: cheapestMarket?.marketId,
            cheapestPrice: cheapestMarket?.averagePrice,
            expensiveMarket: expensiveMarket?.marketId,
            expensivePrice: expensiveMarket?.averagePrice,
            priceDifference: cheapestMarket && expensiveMarket 
                ? parseFloat((expensiveMarket.averagePrice - cheapestMarket.averagePrice).toFixed(2))
                : 0,
            savingsPercent: cheapestMarket && expensiveMarket
                ? parseFloat(((expensiveMarket.averagePrice - cheapestMarket.averagePrice) / expensiveMarket.averagePrice * 100).toFixed(2))
                : 0
        },
        recommendation: cheapestMarket 
            ? `Buy from ${cheapestMarket.marketId} for the best price`
            : 'Not enough data for recommendation'
    };
}

/**
 * Get all price history stats
 */
function getAllStats() {
    const stats = {
        totalProducts: 0,
        totalDataPoints: 0,
        oldestEntry: null,
        newestEntry: null
    };
    
    priceHistory.forEach((history, key) => {
        stats.totalProducts++;
        stats.totalDataPoints += history.length;
        
        history.forEach(h => {
            if (!stats.oldestEntry || new Date(h.timestamp) < new Date(stats.oldestEntry)) {
                stats.oldestEntry = h.timestamp;
            }
            if (!stats.newestEntry || new Date(h.timestamp) > new Date(stats.newestEntry)) {
                stats.newestEntry = h.timestamp;
            }
        });
    });
    
    return stats;
}

/**
 * Clear old history entries
 */
function cleanupOldHistory(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let entriesRemoved = 0;
    
    priceHistory.forEach((history, key) => {
        const originalLength = history.length;
        const filtered = history.filter(h => new Date(h.timestamp) >= cutoffDate);
        entriesRemoved += originalLength - filtered.length;
        priceHistory.set(key, filtered);
    });
    
    return { entriesRemoved, cutoffDate: cutoffDate.toISOString() };
}

export {
    recordPrice,
    getHistory,
    calculateTrend,
    forecastPrice,
    getSeasonalAnalysis,
    getMarketComparisonReport,
    getAllStats,
    cleanupOldHistory
};
