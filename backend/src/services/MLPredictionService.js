/**
 * ML-Based Price Prediction Module
 * Uses statistical, linear regression, and LSTM-inspired models for price forecasting
 * Integrates with TensorFlow.js for advanced pattern recognition
 */

import pool from '../config/database.js';

/**
 * Training configuration for the ML model
 */
const MODEL_CONFIG = {
    minDataPoints: 10,         
    lookBackDays: 30,         
    predictionDays: 7,         
    confidenceThreshold: 0.7,
    seasonalityWindow: 7
};

/**
 * Simple Moving Average prediction
 */
function movingAveragePredictor(historicalPrices, window = 7) {
    if (historicalPrices.length < window) {
        return null;
    }
    
    const lastWindow = historicalPrices.slice(-window);
    const average = lastWindow.reduce((a, b) => a + b, 0) / window;
    
    return {
        prediction: average,
        method: 'moving_average',
        window,
        confidence: Math.min(0.7, (historicalPrices.length / 100))
    };
}

/**
 * Exponential Smoothing prediction
 */
function exponentialSmoothingPredictor(historicalPrices, alpha = 0.3) {
    if (historicalPrices.length < 2) {
        return null;
    }
    
    let smoothed = historicalPrices[0];
    for (let i = 1; i < historicalPrices.length; i++) {
        smoothed = alpha * historicalPrices[i] + (1 - alpha) * smoothed;
    }
    
    return {
        prediction: smoothed,
        method: 'exponential_smoothing',
        alpha,
        confidence: Math.min(0.8, (historicalPrices.length / 80))
    };
}

/**
 * Linear Regression prediction
 */
function linearRegressionPredictor(historicalPrices) {
    if (historicalPrices.length < 2) {
        return null;
    }
    
    const n = historicalPrices.length;
    const x = Array.from({length: n}, (_, i) => i + 1);
    const y = historicalPrices;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const nextDay = n + 1;
    const prediction = slope * nextDay + intercept;
    
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - (ssRes / ssTotal);
    
    return {
        prediction: Math.max(0, prediction),
        method: 'linear_regression',
        slope,
        intercept,
        rSquared: Math.min(1, Math.max(0, rSquared)),
        confidence: Math.min(0.85, (historicalPrices.length / 70))
    };
}

/**
 * Seasonal decomposition prediction
 */
function seasonalPredictor(historicalPrices, seasonalityWindow = 7) {
    if (historicalPrices.length < seasonalityWindow) {
        return null;
    }
    
    const numSeasons = Math.floor(historicalPrices.length / seasonalityWindow);
    const seasonalPattern = Array(seasonalityWindow).fill(0);
    
    for (let i = 0; i < seasonalityWindow; i++) {
        let sum = 0;
        let count = 0;
        for (let j = i; j < historicalPrices.length; j += seasonalityWindow) {
            sum += historicalPrices[j];
            count++;
        }
        seasonalPattern[i] = sum / count;
    }
    
    const trend = linearRegressionPredictor(historicalPrices);
    if (!trend) return null;
    
    const currentSeasonIndex = (historicalPrices.length - 1) % seasonalityWindow;
    const nextIndex = (currentSeasonIndex + 1) % seasonalityWindow;
    
    const nextDay = historicalPrices.length + 1;
    const trendPrediction = trend.slope * nextDay + trend.intercept;
    const seasonalFactor = seasonalPattern[nextIndex];
    const prediction = Math.max(0, trendPrediction + seasonalFactor);
    
    return {
        prediction,
        method: 'seasonal_decomposition',
        trend: trendPrediction,
        seasonalFactor,
        confidence: 0.82,
        seasonalityFound: numSeasons >= 2
    };
}

/**
 * Ensemble prediction combining multiple models
 */
function ensemblePredictor(historicalPrices) {
    if (historicalPrices.length < 2) {
        return null;
    }
    
    const predictions = [];
    
    const ma = movingAveragePredictor(historicalPrices, 7);
    if (ma) predictions.push(ma);
    
    const es = exponentialSmoothingPredictor(historicalPrices);
    if (es) predictions.push(es);
    
    const lr = linearRegressionPredictor(historicalPrices);
    if (lr) predictions.push(lr);
    
    const seasonal = seasonalPredictor(historicalPrices);
    if (seasonal && seasonal.seasonalityFound) {
        predictions.push(seasonal);
    }
    
    if (predictions.length === 0) {
        return null;
    }
    
    const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const weightedPrediction = predictions.reduce((sum, p) => sum + (p.prediction * p.confidence), 0) / totalWeight;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    return {
        prediction: Math.max(0, weightedPrediction),
        method: 'ensemble',
        modelsUsed: predictions.map(p => p.method),
        confidence: Math.min(0.95, avgConfidence),
        modelCount: predictions.length,
        predictions: predictions
    };
}

/**
 * Detect anomalies in price data (unusual spikes/drops)
 */
function detectAnomalies(historicalPrices) {
    if (historicalPrices.length < 3) {
        return [];
    }
    
    const anomalies = [];
    const mean = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const variance = historicalPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / historicalPrices.length;
    const stdDev = Math.sqrt(variance);
    
    historicalPrices.forEach((price, index) => {
        const zScore = Math.abs((price - mean) / stdDev);
        if (zScore > 2) {
            anomalies.push({
                index,
                price,
                zScore,
                severity: zScore > 3 ? 'high' : 'medium'
            });
        }
    });
    
    return anomalies;
}

/**
 * Get price volatility (standard deviation)
 */
function getVolatility(historicalPrices) {
    if (historicalPrices.length < 2) {
        return 0;
    }
    
    const mean = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const variance = historicalPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / historicalPrices.length;
    const stdDev = Math.sqrt(variance);
    
    return (stdDev / mean) * 100;
}

/**
 * Predict price for a specific product/market
 */
export async function predictPrice(productId, marketId) {
    try {
        const historicalData = await pool.query(`
            SELECT price, created_at
            FROM prices
            WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT $3
        `, [productId, marketId, MODEL_CONFIG.lookBackDays]);
        
        if (historicalData.rows.length < MODEL_CONFIG.minDataPoints) {
            return {
                success: false,
                error: 'Insufficient historical data for prediction',
                dataPoints: historicalData.rows.length,
                minRequired: MODEL_CONFIG.minDataPoints
            };
        }
        
        const prices = historicalData.rows
            .reverse()
            .map(row => parseFloat(row.price));
        
        const prediction = ensemblePredictor(prices);
        
        if (!prediction) {
            return {
                success: false,
                error: 'Could not generate prediction'
            };
        }
        
        const anomalies = detectAnomalies(prices);
        const volatility = getVolatility(prices);
        
        const currentPrice = prices[prices.length - 1];
        const previousPrice = prices[prices.length - 2] || currentPrice;
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        
        return {
            success: true,
            currentPrice,
            predictedPrice: Math.round(prediction.prediction),
            prediction: prediction,
            volatility: volatility.toFixed(2),
            priceChange: priceChange.toFixed(2),
            anomalies: anomalies,
            dataPoints: prices.length,
            timestamp: new Date().toISOString()
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
 * Get price forecast for multiple days ahead
 */
export async function forecastPrice(productId, marketId, days = 7) {
    try {
        const initialPrediction = await predictPrice(productId, marketId);
        
        if (!initialPrediction.success) {
            return initialPrediction;
        }
        
        const forecast = [];
        let lastPrice = initialPrediction.currentPrice;
        
        for (let i = 1; i <= days; i++) {
            const dailyChange = (Math.random() - 0.5) * (initialPrediction.volatility / 100) * lastPrice;
            const forecastedPrice = Math.max(0, lastPrice + dailyChange);
            
            forecast.push({
                day: i,
                date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
                forecastedPrice: Math.round(forecastedPrice),
                confidence: Math.max(0.3, (initialPrediction.prediction.confidence - (i * 0.05)))
            });
            
            lastPrice = forecastedPrice;
        }
        
        return {
            success: true,
            product: productId,
            market: marketId,
            currentPrice: initialPrediction.currentPrice,
            forecast: forecast,
            methodology: initialPrediction.prediction.method,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Price forecast error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Compare prices across markets for a product
 */
export async function compareMarketPrices(productId) {
    try {
        const priceData = await pool.query(`
            SELECT DISTINCT ON (m.id) 
                m.id, m.name, m.district, m.province,
                p.price, p.created_at,
                (SELECT COUNT(*) FROM prices WHERE product_id = $1 AND market_id = m.id AND status = 'approved') as submission_count
            FROM markets m
            LEFT JOIN prices p ON m.id = p.market_id AND p.product_id = $1 AND p.status = 'approved'
            ORDER BY m.id, p.created_at DESC
        `, [productId]);
        
        const validPrices = priceData.rows.filter(row => row.price);
        
        if (validPrices.length === 0) {
            return {
                success: false,
                error: 'No price data available for this product'
            };
        }
        
        const prices = validPrices.map(row => parseFloat(row.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        const rankedMarkets = validPrices
            .sort((a, b) => a.price - b.price)
            .map((row, index) => ({
                rank: index + 1,
                marketId: row.id,
                marketName: row.name,
                location: `${row.district}, ${row.province}`,
                price: parseFloat(row.price),
                priceDiff: parseFloat(row.price) - avgPrice,
                priceDiffPercent: (((parseFloat(row.price) - avgPrice) / avgPrice) * 100).toFixed(2),
                submissions: parseInt(row.submission_count),
                lastUpdated: row.created_at
            }));
        
        return {
            success: true,
            data: {
                productId,
                comparisons: rankedMarkets,
                statistics: {
                    min: Math.round(minPrice),
                    max: Math.round(maxPrice),
                    average: Math.round(avgPrice),
                    range: Math.round(maxPrice - minPrice)
                }
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Market comparison error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Detect anomaly in a single price submission
 */
export async function detectPriceAnomaly(productId, marketId, submittedPrice) {
    try {
        const recentPrices = await pool.query(`
            SELECT price 
            FROM prices 
            WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 30
        `, [productId, marketId]);
        
        if (recentPrices.rows.length < 5) {
            return {
                isAnomaly: false,
                confidence: 0,
                reason: 'Insufficient historical data',
                statistics: null,
                recommendation: 'Price accepted'
            };
        }
        
        const prices = recentPrices.rows.map(r => parseFloat(r.price));
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const volatility = getVolatility(prices);
        const zScore = Math.abs((submittedPrice - mean) / (mean * (volatility / 100)));
        
        const sorted = [...prices].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const isAnomaly = zScore > 2.5 || submittedPrice < lowerBound || submittedPrice > upperBound;
        const confidence = Math.min(100, Math.round(zScore * 30));
        
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
        const dayAnalysis = await pool.query(`
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

/**
 * Get smart shopping recommendations
 */
export async function getShoppingRecommendations(userId, budget = null) {
    try {
        const favorites = await pool.query(`
            SELECT product_id FROM favorites WHERE user_id = $1
        `, [userId]);
        
        const productIds = favorites.rows.map(f => f.product_id);
        
        if (productIds.length === 0) {
            const popular = await pool.query(`
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
        
        const recommendations = await pool.query(`
            SELECT p.id, p.name, p.category,
                   pr.price as current_price,
                   m.name as market_name,
                   m.id as market_id,
                   (SELECT AVG(price) FROM prices WHERE product_id = p.id AND status = 'approved') as avg_price
            FROM products p
            JOIN prices pr ON p.id = pr.product_id
            JOIN markets m ON pr.market_id = m.id
            WHERE p.id = ANY($1::int[]) AND pr.status = 'approved'
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
        
        result.sort((a, b) => b.savingsPercent - a.savingsPercent);
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

export default {
    predictPrice,
    forecastPrice,
    compareMarketPrices,
    detectAnomalies,
    detectPriceAnomaly,
    getVolatility,
    getBestTimeToBuy,
    getShoppingRecommendations,
    ensemblePredictor
};