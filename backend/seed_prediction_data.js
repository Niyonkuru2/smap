#!/usr/bin/env node
/**
 * Seed Prediction Data Script
 * Generates 10-15 historical prices for each product-market combination
 * to enable AI price prediction models to work properly
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import database from same module
import { db } from './src/database.js';

// Product base prices for realistic generation
const productBasePrices = {
    1: { name: 'Tomato', min: 400, max: 800, volatility: 0.15 },
    2: { name: 'Rice', min: 200, max: 350, volatility: 0.08 },
    3: { name: 'Banana', min: 150, max: 400, volatility: 0.12 },
    4: { name: 'Onion', min: 300, max: 600, volatility: 0.10 },
    5: { name: 'Potato', min: 150, max: 300, volatility: 0.09 },
    6: { name: 'Cabbage', min: 100, max: 250, volatility: 0.11 },
    7: { name: 'Maize', min: 150, max: 280, volatility: 0.07 },
    8: { name: 'Beans', min: 400, max: 700, volatility: 0.09 },
    9: { name: 'Avocado', min: 800, max: 1500, volatility: 0.14 },
    10: { name: 'Carrots', min: 200, max: 400, volatility: 0.10 }
};

// Market price adjustments (market efficiency factors)
const marketMultipliers = {
    'kimironko': 1.0,      // Base market
    'gitega': 0.95,        // Slightly cheaper
    'huye': 0.98,          // Slightly cheaper
    'muhanga': 1.02,       // Slightly expensive
    'ruhengeri': 1.05,     // Remote, more expensive
    'nyamiata': 0.96       // Cheaper
};

/**
 * Generate realistic historical prices with trends and seasonality
 */
function generateHistoricalPrices(productId, marketId, count = 15) {
    const prices = [];
    const basePrice = productBasePrices[productId];
    const mid = (basePrice.min + basePrice.max) / 2;
    const marketMultiplier = marketMultipliers[marketId] || 1.0;
    
    // Generate dates spread over last 30 days
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < count; i++) {
        // Create date spread roughly evenly over 30 days (but with some randomness)
        const daysAgo = Math.floor((i / count) * 30) + Math.random() * 2;
        const timestamp = new Date(now - daysAgo * dayMs);
        
        // Apply trend (slight upward or downward)
        const trend = (Math.random() - 0.5) * 0.2; // -10% to +10% trend
        const trendFactor = 1 + (trend * (i / count));
        
        // Apply volatility and market factors
        const variance = (Math.random() - 0.5) * basePrice.volatility;
        const price = Math.round(
            (mid * marketMultiplier * trendFactor) + 
            (variance * mid)
        );
        
        prices.push({
            productId,
            marketId,
            price: Math.max(basePrice.min, Math.min(basePrice.max, price)),
            timestamp,
            unit: 'kg',
            status: 'approved'
        });
    }
    
    return prices;
}

async function seedPredictionData() {
    try {
        console.log('\n🚀 SEEDING PREDICTION DATA\n');
        console.log('Generating 10-15 historical prices for each product-market combination...\n');
        
        let totalInserted = 0;
        let skipped = 0;
        
        // Get existing products and markets
        const productsResult = await db.query('SELECT id FROM products ORDER BY id');
        const marketsResult = await db.query('SELECT id FROM markets ORDER BY id');
        
        const productIds = productsResult.rows.map(r => r.id);
        const marketIds = marketsResult.rows.map(r => r.id);
        
        console.log(`📦 Found ${productIds.length} products`);
        console.log(`🏪 Found ${marketIds.length} markets`);
        console.log(`📊 Will create ~${productIds.length * marketIds.length * 12} price records\n`);
        
        // For each product-market combination
        for (const productId of productIds) {
            for (const marketId of marketIds) {
                // Generate 10-15 prices with realistic variations
                const historicalPrices = generateHistoricalPrices(productId, marketId, 12 + Math.floor(Math.random() * 4));
                
                for (const priceData of historicalPrices) {
                    try {
                        const result = await db.query(
                            `INSERT INTO prices 
                             (product_id, market_id, price, unit, status, created_at, updated_at, source) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, 'prediction_seed')
                             RETURNING id`,
                            [
                                priceData.productId,
                                priceData.marketId,
                                priceData.price,
                                priceData.unit,
                                priceData.status,
                                priceData.timestamp,
                                priceData.timestamp
                            ]
                        );
                        
                        if (result.rows[0]) {
                            totalInserted++;
                        }
                    } catch (err) {
                        if (!err.message.includes('duplicate')) {
                            console.error(`Error inserting price for product ${productId}, market ${marketId}:`, err.message);
                        } else {
                            skipped++;
                        }
                    }
                }
            }
        }
        
        console.log(`\n✅ SEEDING COMPLETE\n`);
        console.log(`📊 Statistics:`);
        console.log(`   • Successfully inserted: ${totalInserted} new price records`);
        console.log(`   • Skipped (duplicates): ${skipped} records`);
        console.log(`   • Product-market combos: ${productIds.length} × ${marketIds.length} = ${productIds.length * marketIds.length}`);
        console.log(`   • Average prices per combo: ~12-15 records`);
        
        console.log(`\n🎯 NEXT STEPS:`);
        console.log(`   1. Run: npm test`);
        console.log(`   2. Or test predictions: curl "https://smpmps-test-1.onrender.com/predict/price/1/kimironko"`);
        console.log(`   3. Predictions should now work with sufficient historical data\n`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ ERROR during seeding:', error);
        process.exit(1);
    }
}

// Run the seeding
seedPredictionData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});