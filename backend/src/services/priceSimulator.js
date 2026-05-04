/**
 * Rwanda Market Price Simulator
 * Generates realistic prices that vary by market location, time, and supply/demand
 * Simulates how real prices would differ across Rwanda's markets
 */

// Base prices for products in RWF (Rwandan Francs)
// These are average prices, actual prices vary by market and conditions
const basePrices = {
    // Grains & Staples
    'Rice': { base: 1800, unit: 'kg', volatility: 0.15 },
    'Maize': { base: 450, unit: 'kg', volatility: 0.20 },
    'Wheat Flour': { base: 1200, unit: 'kg', volatility: 0.12 },
    'Sorghum': { base: 600, unit: 'kg', volatility: 0.18 },
    'Beans': { base: 900, unit: 'kg', volatility: 0.25 },
    'Cassava': { base: 300, unit: 'kg', volatility: 0.20 },
    'Irish Potatoes': { base: 400, unit: 'kg', volatility: 0.30 },
    'Sweet Potatoes': { base: 350, unit: 'kg', volatility: 0.25 },
    
    // Vegetables
    'Tomatoes': { base: 800, unit: 'kg', volatility: 0.35 },
    'Onions': { base: 700, unit: 'kg', volatility: 0.30 },
    'Cabbage': { base: 400, unit: 'piece', volatility: 0.25 },
    'Carrots': { base: 600, unit: 'kg', volatility: 0.20 },
    'Green Peppers': { base: 1200, unit: 'kg', volatility: 0.30 },
    'Eggplant': { base: 500, unit: 'kg', volatility: 0.25 },
    'Spinach': { base: 200, unit: 'bundle', volatility: 0.20 },
    'Amaranth Leaves': { base: 150, unit: 'bundle', volatility: 0.20 },
    
    // Fruits
    'Bananas': { base: 1500, unit: 'bunch', volatility: 0.20 },
    'Avocados': { base: 200, unit: 'piece', volatility: 0.35 },
    'Mangoes': { base: 150, unit: 'piece', volatility: 0.40 },
    'Pineapples': { base: 1000, unit: 'piece', volatility: 0.25 },
    'Passion Fruit': { base: 100, unit: 'piece', volatility: 0.30 },
    'Oranges': { base: 100, unit: 'piece', volatility: 0.25 },
    'Papaya': { base: 500, unit: 'piece', volatility: 0.30 },
    
    // Meat & Protein
    'Beef': { base: 4500, unit: 'kg', volatility: 0.15 },
    'Goat Meat': { base: 5000, unit: 'kg', volatility: 0.15 },
    'Chicken': { base: 5500, unit: 'kg', volatility: 0.18 },
    'Pork': { base: 4000, unit: 'kg', volatility: 0.15 },
    'Tilapia Fish': { base: 3500, unit: 'kg', volatility: 0.20 },
    'Eggs': { base: 150, unit: 'piece', volatility: 0.15 },
    
    // Dairy
    'Fresh Milk': { base: 600, unit: 'litre', volatility: 0.10 },
    'Yogurt': { base: 800, unit: 'litre', volatility: 0.12 },
    
    // Cooking Essentials
    'Cooking Oil': { base: 3500, unit: 'litre', volatility: 0.12 },
    'Palm Oil': { base: 2500, unit: 'litre', volatility: 0.15 },
    'Sugar': { base: 1400, unit: 'kg', volatility: 0.10 },
    'Salt': { base: 500, unit: 'kg', volatility: 0.05 }
};

// Market location factors - prices vary by province/region
// Urban markets are generally more expensive, rural areas with production are cheaper
const marketFactors = {
    // Kigali - Urban, higher prices
    'Kimironko Market': { factor: 1.15, province: 'Kigali' },
    'Nyabugogo Market': { factor: 1.10, province: 'Kigali' },
    'Kicukiro Market': { factor: 1.12, province: 'Kigali' },
    'Remera Market': { factor: 1.14, province: 'Kigali' },
    
    // Eastern Province - Agricultural region
    'Rwamagana Market': { factor: 0.95, province: 'Eastern' },
    'Nyagatare Market': { factor: 0.90, province: 'Eastern' },
    'Kayonza Market': { factor: 0.92, province: 'Eastern' },
    'Ngoma Market': { factor: 0.93, province: 'Eastern' },
    
    // Western Province - Near DRC border
    'Rubavu Market': { factor: 1.05, province: 'Western' },
    'Rusizi Market': { factor: 1.08, province: 'Western' },
    'Karongi Market': { factor: 0.98, province: 'Western' },
    'Nyamasheke Market': { factor: 0.96, province: 'Western' },
    
    // Northern Province - Agricultural
    'Musanze Market': { factor: 1.02, province: 'Northern' },
    'Gakenke Market': { factor: 0.92, province: 'Northern' },
    'Burera Market': { factor: 0.94, province: 'Northern' },
    'Gicumbi Market': { factor: 0.95, province: 'Northern' },
    
    // Southern Province - Agricultural
    'Huye Market': { factor: 0.97, province: 'Southern' },
    'Nyamagabe Market': { factor: 0.93, province: 'Southern' },
    'Ruhango Market': { factor: 0.94, province: 'Southern' },
    'Muhanga Market': { factor: 0.96, province: 'Southern' }
};

// Seasonal factors - some products have seasonal price variations
const seasonalFactors = {
    'Tomatoes': { peak: [6, 7, 8], low: [1, 2, 12] }, // Peak in dry season
    'Mangoes': { peak: [11, 12, 1, 2], low: [5, 6, 7, 8] }, // Mango season
    'Avocados': { peak: [3, 4, 5, 6], low: [9, 10, 11] },
    'Irish Potatoes': { peak: [6, 7], low: [1, 2] },
    'Beans': { peak: [6, 7, 12, 1], low: [3, 4, 9, 10] }
};

/**
 * Calculate price based on all factors
 */
function calculatePrice(productName, marketName) {
    const product = basePrices[productName];
    if (!product) {
        // Default for unknown products
        return { price: 1000, unit: 'unit' };
    }
    
    const market = marketFactors[marketName] || { factor: 1.0, province: 'Unknown' };
    
    // Base price with market location factor
    let price = product.base * market.factor;
    
    // Apply seasonal factor
    const currentMonth = new Date().getMonth() + 1;
    const seasonal = seasonalFactors[productName];
    if (seasonal) {
        if (seasonal.peak.includes(currentMonth)) {
            // Lower prices in peak season (more supply)
            price *= 0.85;
        } else if (seasonal.low.includes(currentMonth)) {
            // Higher prices in low season (less supply)
            price *= 1.20;
        }
    }
    
    // Add random daily variation based on volatility
    const dailyVariation = 1 + (Math.random() - 0.5) * product.volatility;
    price *= dailyVariation;
    
    // Round to nearest 50 RWF
    price = Math.round(price / 50) * 50;
    
    return {
        price: Math.max(50, price), // Minimum 50 RWF
        unit: product.unit,
        volatility: product.volatility
    };
}

/**
 * Generate prices for all products across all markets
 */
export function generateMarketPrices() {
    const prices = [];
    const products = Object.keys(basePrices);
    const marketNames = Object.keys(marketFactors);
    
    products.forEach((productName, productIndex) => {
        marketNames.forEach((marketName, marketIndex) => {
            const { price, unit } = calculatePrice(productName, marketName);
            const marketInfo = marketFactors[marketName];
            
            // Calculate trend based on previous "simulated" price
            const previousPrice = price * (1 + (Math.random() - 0.5) * 0.1);
            let trend = 'stable';
            if (price > previousPrice * 1.03) trend = 'up';
            else if (price < previousPrice * 0.97) trend = 'down';
            
            prices.push({
                product_id: productIndex + 1,
                product_name: productName,
                market_id: `market_${marketIndex + 1}`,
                market_name: marketName,
                province: marketInfo.province,
                price: price,
                unit: unit,
                trend: trend,
                last_updated: new Date(),
                source: 'market_survey'
            });
        });
    });
    
    return prices;
}

/**
 * Generate prices for a specific market
 */
export function generatePricesForMarket(marketName) {
    const prices = [];
    const products = Object.keys(basePrices);
    
    products.forEach((productName, productIndex) => {
        const { price, unit } = calculatePrice(productName, marketName);
        const marketInfo = marketFactors[marketName] || { province: 'Unknown' };
        
        prices.push({
            product_id: productIndex + 1,
            product_name: productName,
            price: price,
            unit: unit,
            province: marketInfo.province,
            last_updated: new Date()
        });
    });
    
    return prices;
}

/**
 * Get price comparison across markets for a product
 */
export function compareProductPrices(productName) {
    const comparison = [];
    const marketNames = Object.keys(marketFactors);
    
    marketNames.forEach(marketName => {
        const { price, unit } = calculatePrice(productName, marketName);
        const marketInfo = marketFactors[marketName];
        
        comparison.push({
            market_name: marketName,
            province: marketInfo.province,
            price: price,
            unit: unit,
            price_factor: marketInfo.factor
        });
    });
    
    // Sort by price (cheapest first)
    comparison.sort((a, b) => a.price - b.price);
    
    return comparison;
}

/**
 * Get cheapest markets for a product
 */
export function findCheapestMarkets(productName, limit = 5) {
    const comparison = compareProductPrices(productName);
    return comparison.slice(0, limit);
}

/**
 * Simulate price update from a "remote server" in Rwanda
 * This mimics getting real-time prices from different regional sources
 */
export function simulateRemotePriceUpdate() {
    const sources = [
        { name: 'MINICOM Price Monitor', region: 'National' },
        { name: 'Kigali Market Authority', region: 'Kigali' },
        { name: 'Eastern Province Agri Board', region: 'Eastern' },
        { name: 'Northern Farmers Cooperative', region: 'Northern' },
        { name: 'Southern Market Association', region: 'Southern' },
        { name: 'Western Trade Hub', region: 'Western' }
    ];
    
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomProduct = Object.keys(basePrices)[Math.floor(Math.random() * Object.keys(basePrices).length)];
    const relevantMarkets = Object.entries(marketFactors)
        .filter(([_, info]) => randomSource.region === 'National' || info.province === randomSource.region)
        .map(([name]) => name);
    
    const updates = relevantMarkets.map(marketName => {
        const { price, unit } = calculatePrice(randomProduct, marketName);
        return {
            product_name: randomProduct,
            market_name: marketName,
            price: price,
            unit: unit,
            source: randomSource.name,
            timestamp: new Date()
        };
    });
    
    return {
        source: randomSource,
        product: randomProduct,
        updates: updates
    };
}

export default {
    generateMarketPrices,
    generatePricesForMarket,
    compareProductPrices,
    findCheapestMarkets,
    simulateRemotePriceUpdate,
    basePrices,
    marketFactors
};
