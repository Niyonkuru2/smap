/**
 * AI Price Prediction Module
 * Uses statistical analysis and machine learning techniques for price forecasting
 */

import { db } from './database.js';

// Store for trained models (in production, use a proper ML framework)
const models = new Map();

/**
 * Calculate moving average
 */
function movingAverage(data, window) {
    const result = [];
    for (let i = window - 1; i < data.length; i++) {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
    }
    return result;
}

/**
 * Calculate exponential moving average
 */
function exponentialMovingAverage(data, alpha = 0.3) {
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
}

/**
 * Simple linear regression
 */
function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

/**
 * Calculate trend direction
 */
function calculateTrend(prices) {
    if (prices.length < 2) return 'stable';
    
    const x = prices.map((_, i) => i);
    const { slope } = linearRegression(x, prices);
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const normalizedSlope = slope / avgPrice * 100;
    
    if (normalizedSlope > 2) return 'increasing';
    if (normalizedSlope < -2) return 'decreasing';
    return 'stable';
}

/**
 * Detect seasonality patterns
 */
function detectSeasonality(data, period = 7) {
    if (data.length < period * 2) return null;
    
    const seasonalIndices = [];
    for (let i = 0; i < period; i++) {
        const values = data.filter((_, idx) => idx % period === i);
        seasonalIndices.push(values.reduce((a, b) => a + b, 0) / values.length);
    }
    
    const avgIndex = seasonalIndices.reduce((a, b) => a + b, 0) / period;
    return seasonalIndices.map(idx => idx / avgIndex);
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(prices) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / prices.length);
}

/**
 * Predict future prices using multiple methods
 */
export async function predictPrice(productId, marketId, daysAhead = 7) {
    try {
        // Fetch historical price data
        const history = await db.query(`
            SELECT price, created_at 
            FROM prices 
            WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 90
        `, [productId, marketId]);

        if (history.rows.length < 7) {
            return {
                success: false,
                error: 'Insufficient historical data for prediction',
                minDataRequired: 7,
                currentData: history.rows.length
            };
        }

        const prices = history.rows.map(r => parseFloat(r.price)).reverse();
        const dates = history.rows.map(r => r.created_at).reverse();
        
        // Calculate predictions using different methods
        const predictions = [];
        const currentPrice = prices[prices.length - 1];
        
        // Method 1: Linear Regression
        const x = prices.map((_, i) => i);
        const { slope, intercept } = linearRegression(x, prices);
        const linearPrediction = slope * (prices.length + daysAhead - 1) + intercept;
        
        // Method 2: Exponential Moving Average
        const ema = exponentialMovingAverage(prices, 0.2);
        const emaPrediction = ema[ema.length - 1];
        
        // Method 3: Simple Moving Average with trend
        const ma7 = movingAverage(prices, Math.min(7, prices.length));
        const ma30 = movingAverage(prices, Math.min(30, prices.length));
        const trend = calculateTrend(prices.slice(-14));
        
        let maPrediction = ma7[ma7.length - 1];
        if (trend === 'increasing') {
            maPrediction *= 1 + (0.02 * daysAhead);
        } else if (trend === 'decreasing') {
            maPrediction *= 1 - (0.015 * daysAhead);
        }
        
        // Weighted average of predictions
        const weightedPrediction = (
            linearPrediction * 0.3 +
            emaPrediction * 0.4 +
            maPrediction * 0.3
        );
        
        // Calculate confidence interval
        const volatility = calculateVolatility(prices);
        const confidence = Math.max(0.5, 1 - (volatility / currentPrice));
        const margin = volatility * Math.sqrt(daysAhead) * 1.96; // 95% confidence
        
        // Detect seasonality
        const seasonality = detectSeasonality(prices);
        
        // Generate daily predictions
        const dailyPredictions = [];
        for (let day = 1; day <= daysAhead; day++) {
            const dayPrediction = slope * (prices.length + day - 1) + intercept;
            let adjustedPrediction = dayPrediction;
            
            // Apply seasonality adjustment if detected
            if (seasonality && seasonality.length > 0) {
                const dayIndex = (dates.length + day - 1) % seasonality.length;
                adjustedPrediction *= seasonality[dayIndex];
            }
            
            dailyPredictions.push({
                day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                predicted: Math.round(adjustedPrediction),
                low: Math.round(adjustedPrediction - margin * (day / daysAhead)),
                high: Math.round(adjustedPrediction + margin * (day / daysAhead))
            });
        }
        
        return {
            success: true,
            productId,
            marketId,
            currentPrice,
            prediction: {
                value: Math.round(weightedPrediction),
                low: Math.round(weightedPrediction - margin),
                high: Math.round(weightedPrediction + margin),
                confidence: Math.round(confidence * 100),
                daysAhead
            },
            dailyPredictions,
            trend,
            volatility: Math.round(volatility),
            analysis: {
                linearTrend: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'flat',
                priceChange7d: prices.length >= 7 
                    ? Math.round((currentPrice - prices[prices.length - 7]) / prices[prices.length - 7] * 100) 
                    : null,
                priceChange30d: prices.length >= 30 
                    ? Math.round((currentPrice - prices[prices.length - 30]) / prices[prices.length - 30] * 100) 
                    : null,
                avgPrice7d: Math.round(prices.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, prices.length)),
                avgPrice30d: Math.round(prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, prices.length)),
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices)
            },
            historicalData: prices.slice(-30).map((price, i) => ({
                date: dates[Math.max(0, dates.length - 30) + i],
                price
            }))
        };
    } catch (error) {
        console.error('Price prediction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get smart shopping recommendations
 */
export async function getShoppingRecommendations(userId, budget = null) {
    try {
        // Get user's favorites and shopping history
        const favorites = await db.query(`
            SELECT product_id FROM favorites WHERE user_id = $1
        `, [userId]);
        
        const productIds = favorites.rows.map(f => f.product_id);
        
        if (productIds.length === 0) {
            // Return general recommendations for popular products
            const popular = await db.query(`
                SELECT p.id, p.name, p.category,
                       AVG(pr.price) as avg_price,
                       MIN(pr.price) as min_price,
                       m.name as best_market,
                       m.id as best_market_id
                FROM products p
                JOIN prices pr ON p.id = pr.product_id
                JOIN markets m ON pr.market_id = m.id
                WHERE pr.status = 'approved'
                GROUP BY p.id, p.name, p.category, m.name, m.id
                ORDER BY COUNT(*) DESC
                LIMIT 10
            `);
            
            return {
                success: true,
                recommendations: popular.rows.map(p => ({
                    productId: p.id,
                    productName: p.name,
                    category: p.category,
                    avgPrice: Math.round(p.avg_price),
                    bestPrice: Math.round(p.min_price),
                    bestMarket: p.best_market,
                    bestMarketId: p.best_market_id,
                    recommendation: 'Popular item with good availability'
                })),
                type: 'popular'
            };
        }
        
        // Find best prices for user's favorite products
        const recommendations = await db.query(`
            SELECT p.id, p.name, p.category,
                   pr.price as current_price,
                   m.name as market_name,
                   m.id as market_id,
                   (SELECT AVG(price) FROM prices WHERE product_id = p.id AND status = 'approved') as avg_price
            FROM products p
            JOIN prices pr ON p.id = pr.product_id
            JOIN markets m ON pr.market_id = m.id
            WHERE p.id = ANY($1) AND pr.status = 'approved'
            AND pr.price = (
                SELECT MIN(price) 
                FROM prices 
                WHERE product_id = p.id AND status = 'approved'
            )
            ORDER BY p.name
        `, [productIds]);
        
        const result = recommendations.rows.map(r => {
            const savings = r.avg_price - r.current_price;
            return {
                productId: r.id,
                productName: r.name,
                category: r.category,
                currentPrice: Math.round(r.current_price),
                avgPrice: Math.round(r.avg_price),
                savings: Math.round(savings),
                savingsPercent: Math.round(savings / r.avg_price * 100),
                bestMarket: r.market_name,
                bestMarketId: r.market_id,
                recommendation: savings > 0 
                    ? `Save ${Math.round(savings)} RWF at ${r.market_name}!`
                    : 'Currently at average price'
            };
        });
        
        // Sort by potential savings
        result.sort((a, b) => b.savingsPercent - a.savingsPercent);
        
        // Calculate total potential savings
        const totalSavings = result.reduce((sum, r) => sum + Math.max(0, r.savings), 0);
        
        return {
            success: true,
            recommendations: result,
            totalPotentialSavings: totalSavings,
            type: 'personalized'
        };
    } catch (error) {
        console.error('Shopping recommendations error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Detect anomalies in price submissions
 */
export async function detectPriceAnomaly(productId, marketId, submittedPrice) {
    try {
        // Get recent prices for this product/market
        const recentPrices = await db.query(`
            SELECT price 
            FROM prices 
            WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 30
        `, [productId, marketId]);
        
        if (recentPrices.rows.length < 5) {
            // Not enough data, allow submission
            return {
                isAnomaly: false,
                confidence: 0,
                reason: 'Insufficient historical data'
            };
        }
        
        const prices = recentPrices.rows.map(r => parseFloat(r.price));
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const volatility = calculateVolatility(prices);
        
        // Z-score calculation
        const zScore = (submittedPrice - mean) / volatility;
        
        // Interquartile range method
        const sorted = [...prices].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const isAnomaly = Math.abs(zScore) > 2.5 || submittedPrice < lowerBound || submittedPrice > upperBound;
        const confidence = Math.min(100, Math.round(Math.abs(zScore) * 30));
        
        let reason = '';
        if (isAnomaly) {
            if (submittedPrice > upperBound) {
                reason = `Price is ${Math.round((submittedPrice - mean) / mean * 100)}% above average`;
            } else if (submittedPrice < lowerBound) {
                reason = `Price is ${Math.round((mean - submittedPrice) / mean * 100)}% below average`;
            }
        }
        
        return {
            isAnomaly,
            confidence,
            reason,
            statistics: {
                mean: Math.round(mean),
                volatility: Math.round(volatility),
                zScore: Math.round(zScore * 100) / 100,
                bounds: {
                    lower: Math.round(lowerBound),
                    upper: Math.round(upperBound)
                }
            },
            recommendation: isAnomaly 
                ? 'This price seems unusual. Please verify before approving.'
                : 'Price appears to be within normal range.'
        };
    } catch (error) {
        console.error('Anomaly detection error:', error);
        return {
            isAnomaly: false,
            error: error.message
        };
    }
}

/**
 * Get best time to buy recommendations
 */
export async function getBestTimeToBuy(productId) {
    try {
        // Analyze price patterns by day of week
        const dayAnalysis = await db.query(`
            SELECT 
                EXTRACT(DOW FROM created_at) as day_of_week,
                AVG(price) as avg_price,
                MIN(price) as min_price,
                COUNT(*) as sample_size
            FROM prices
            WHERE product_id = $1 AND status = 'approved'
            GROUP BY EXTRACT(DOW FROM created_at)
            ORDER BY avg_price ASC
        `, [productId]);
        
        if (dayAnalysis.rows.length === 0) {
            return {
                success: false,
                error: 'No price data available'
            };
        }
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const analysis = dayAnalysis.rows.map(row => ({
            dayOfWeek: parseInt(row.day_of_week),
            dayName: dayNames[parseInt(row.day_of_week)],
            avgPrice: Math.round(parseFloat(row.avg_price)),
            minPrice: Math.round(parseFloat(row.min_price)),
            sampleSize: parseInt(row.sample_size)
        }));
        
        // Find best and worst days
        const bestDay = analysis[0];
        const worstDay = analysis[analysis.length - 1];
        
        const potentialSavings = worstDay.avgPrice - bestDay.avgPrice;
        const savingsPercent = Math.round(potentialSavings / worstDay.avgPrice * 100);
        
        return {
            success: true,
            productId,
            bestDay: {
                ...bestDay,
                recommendation: `Best day to buy - prices are typically ${savingsPercent}% lower`
            },
            worstDay: {
                ...worstDay,
                recommendation: 'Avoid buying on this day if possible'
            },
            allDays: analysis,
            potentialSavings,
            savingsPercent,
            tip: savingsPercent >= 5 
                ? `Shopping on ${bestDay.dayName} instead of ${worstDay.dayName} could save you ${savingsPercent}%!`
                : 'Prices are relatively stable throughout the week.'
        };
    } catch (error) {
        console.error('Best time to buy error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    predictPrice,
    getShoppingRecommendations,
    detectPriceAnomaly,
    getBestTimeToBuy
};
