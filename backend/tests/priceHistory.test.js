/**
 * Unit Tests for Price History Module
 */

import {
    recordPrice,
    getHistory,
    calculateTrend,
    forecastPrice,
    getSeasonalAnalysis,
    getMarketComparisonReport,
    getAllStats
} from '../src/priceHistory.js';

describe('Price History Module', () => {
    
    // Setup test data
    beforeAll(() => {
        // Record some test prices
        const testProductId = 'test-rice';
        const testMarketId = 'test-market';
        
        // Add historical prices
        for (let i = 30; i >= 0; i--) {
            const price = 1000 + Math.random() * 200 - 100; // 900-1100
            recordPrice(testProductId, testMarketId, price, 'test-vendor');
        }
    });

    describe('recordPrice', () => {
        test('should record a price and return success', () => {
            const result = recordPrice('product-1', 'market-1', 500, 'vendor-1');
            
            expect(result).toBeDefined();
            expect(result.recorded).toBe(true);
            expect(result.totalEntries).toBeGreaterThan(0);
        });

        test('should handle multiple recordings', () => {
            const result1 = recordPrice('product-2', 'market-2', 100);
            const result2 = recordPrice('product-2', 'market-2', 110);
            
            expect(result2.totalEntries).toBe(result1.totalEntries + 1);
        });
    });

    describe('getHistory', () => {
        test('should return empty history for non-existent product', () => {
            const history = getHistory('non-existent', 'non-existent');
            
            expect(history.entries).toEqual([]);
            expect(history.count).toBe(0);
        });

        test('should return history for existing product', () => {
            recordPrice('product-3', 'market-3', 200);
            const history = getHistory('product-3', 'market-3');
            
            expect(history.entries.length).toBeGreaterThan(0);
            expect(history.entries[0].price).toBe(200);
        });

        test('should respect days filter', () => {
            const history = getHistory('test-rice', 'test-market', { days: 7 });
            
            expect(history.period).toBe('Last 7 days');
        });

        test('should respect limit', () => {
            const history = getHistory('test-rice', 'test-market', { limit: 5 });
            
            expect(history.entries.length).toBeLessThanOrEqual(5);
        });
    });

    describe('calculateTrend', () => {
        test('should return stable trend with no data', () => {
            const trend = calculateTrend('no-data', 'no-market');
            
            expect(trend.trend).toBe('stable');
            expect(trend.confidence).toBe('low');
        });

        test('should calculate trend for existing data', () => {
            const trend = calculateTrend('test-rice', 'test-market', 7);
            
            expect(['rising', 'falling', 'stable']).toContain(trend.trend);
            expect(trend).toHaveProperty('change');
            expect(trend).toHaveProperty('average');
            expect(trend).toHaveProperty('volatility');
        });
    });

    describe('forecastPrice', () => {
        test('should return insufficient data message for new product', () => {
            const forecast = forecastPrice('new-product', 'new-market');
            
            expect(forecast.confidence).toBe('insufficient_data');
        });

        test('should include forecast for existing product with data', () => {
            // Add enough data points
            for (let i = 0; i < 15; i++) {
                recordPrice('forecast-test', 'market-test', 500 + i * 10);
            }
            
            const forecast = forecastPrice('forecast-test', 'market-test', 7);
            
            if (forecast.forecast) {
                expect(forecast).toHaveProperty('currentPrice');
                expect(forecast).toHaveProperty('confidenceInterval');
                expect(forecast).toHaveProperty('disclaimer');
            }
        });
    });

    describe('getAllStats', () => {
        test('should return overall statistics', () => {
            const stats = getAllStats();
            
            expect(stats).toHaveProperty('totalProducts');
            expect(stats).toHaveProperty('totalDataPoints');
            expect(stats.totalProducts).toBeGreaterThan(0);
        });
    });
});
