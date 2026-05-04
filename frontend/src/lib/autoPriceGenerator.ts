/**
 * Auto Price Generator Utility
 * This generates realistic prices for all products across all markets
 */

import type { Product, Market, PriceData } from '../hooks/useAppData';

// Realistic price ranges for different categories
const categoryPriceRanges: Record<string, { min: number; max: number }> = {
  'Grains': { min: 800, max: 2500 },
  'Vegetables': { min: 300, max: 1500 },
  'Fruits': { min: 500, max: 4000 },
  'Meat': { min: 3000, max: 8000 },
  'Dairy': { min: 500, max: 2000 },
  'Staples': { min: 1000, max: 5000 }
};

// Generate price history for last 30 days
const generatePriceHistory = (basePrice: number, days: number = 30) => {
  const history = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random variation ±15%
    const variation = (Math.random() - 0.5) * 0.3;
    const price = Math.round(basePrice * (1 + variation));
    
    history.push({ date, price });
  }
  
  return history;
};

// Generate random reviews
const generateReviews = (productName: string, marketName: string) => {
  const reviewTemplates = [
    { rating: 5, comment: `Great prices at ${marketName}! Just bought ${productName} here.` },
    { rating: 4, comment: `Good quality, price is fair for ${productName}.` },
    { rating: 5, comment: 'Very fresh and accurate pricing!' },
    { rating: 3, comment: 'Price was okay, but quality varies.' },
    { rating: 4, comment: 'Reasonable prices, will come back.' }
  ];
  
  const numReviews = Math.floor(Math.random() * 3); // 0-2 reviews
  const selectedReviews = [];
  
  for (let i = 0; i < numReviews; i++) {
    const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
    selectedReviews.push({
      id: `r${Math.random().toString(36).substr(2, 9)}`,
      userId: `u${Math.random().toString(36).substr(2, 9)}`,
      userName: ['Alice K.', 'John M.', 'Marie T.', 'David N.', 'Sarah B.'][Math.floor(Math.random() * 5)],
      rating: template.rating,
      comment: template.comment,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      helpful: Math.floor(Math.random() * 20)
    });
  }
  
  return selectedReviews;
};

/**
 * Generate prices for all products in all markets
 * @param allProducts - Array of all products
 * @param allMarkets - Array of all markets
 * @param productsToGenerate - Optional array of product IDs. If not provided, generates for all products
 * @param marketsToUse - Optional array of market IDs. If not provided, uses all markets
 * @returns Array of PriceData objects
 */
export const generateAllPrices = (
  allProducts: Product[],
  allMarkets: Market[],
  productsToGenerate?: string[],
  marketsToUse?: string[]
): PriceData[] => {
  const priceData: PriceData[] = [];
  
  const targetProducts = productsToGenerate 
    ? allProducts.filter(p => productsToGenerate.includes(p.id))
    : allProducts;
    
  const targetMarkets = marketsToUse
    ? allMarkets.filter(m => marketsToUse.includes(m.id))
    : allMarkets;

  targetProducts.forEach(product => {
    // Each product appears in 1-3 random markets
    const numMarkets = Math.floor(Math.random() * 3) + 1;
    const selectedMarkets = [...targetMarkets]
      .sort(() => Math.random() - 0.5)
      .slice(0, numMarkets);

    selectedMarkets.forEach(market => {
      // Get price range for this category
      const priceRange = categoryPriceRanges[product.category] || { min: 500, max: 3000 };
      
      // Generate a base price within the range
      const basePrice = Math.round(
        priceRange.min + Math.random() * (priceRange.max - priceRange.min)
      );
      
      // Calculate variations
      const variation = 0.1; // 10% variation
      const lowest = Math.round(basePrice * (1 - variation));
      const highest = Math.round(basePrice * (1 + variation));
      const average = Math.round((lowest + highest) / 2);
      
      // Random age (0-48 hours)
      const hoursAgo = Math.floor(Math.random() * 48);
      
      // Random trend
      const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
      const trend = trends[Math.floor(Math.random() * trends.length)];
      
      // Random rating
      const rating = Number((3.5 + Math.random() * 1.5).toFixed(1));
      const totalRatings = Math.floor(Math.random() * 50) + 5;
      
      const reviews = generateReviews(product.name, market.name);

      priceData.push({
        productId: product.id,
        marketId: market.id,
        current: basePrice,
        average,
        highest,
        lowest,
        lastUpdated: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        trend,
        history: generatePriceHistory(basePrice),
        rating,
        totalRatings,
        reviews: reviews.length > 0 ? reviews : undefined
      });
    });
  });

  return priceData;
};

/**
 * Generate prices for specific products
 * @param allProducts - Array of all products
 * @param allMarkets - Array of all markets
 * @param productIds - Array of product IDs to generate prices for
 * @returns Array of PriceData objects
 */
export const generatePricesForProducts = (
  allProducts: Product[],
  allMarkets: Market[],
  productIds: string[]
): PriceData[] => {
  return generateAllPrices(allProducts, allMarkets, productIds);
};

/**
 * Generate prices for all products without existing prices
 * @param allProducts - Array of all products
 * @param allMarkets - Array of all markets
 * @param existingPriceData - Current price data to check against
 * @returns Array of PriceData objects for products without prices
 */
export const generateMissingPrices = (
  allProducts: Product[],
  allMarkets: Market[],
  existingPriceData: PriceData[]
): PriceData[] => {
  const productsWithPrices = new Set(existingPriceData.map(p => p.productId));
  const productsWithoutPrices = allProducts
    .filter(p => !productsWithPrices.has(p.id))
    .map(p => p.id);
  
  return generateAllPrices(allProducts, allMarkets, productsWithoutPrices);
};

/**
 * Print generated prices to console (for copying to mockData.ts)
 */
export const printGeneratedPrices = (
  allProducts: Product[],
  allMarkets: Market[],
  priceData: PriceData[]
) => {
  console.log('// Generated Price Data:');
  console.log('export const priceData: PriceData[] = [');
  
  priceData.forEach((price, index) => {
    const product = allProducts.find(p => p.id === price.productId);
    const market = allMarkets.find(m => m.id === price.marketId);
    
    console.log(`  // ${product?.name} at ${market?.name}`);
    console.log('  {');
    console.log(`    productId: '${price.productId}',`);
    console.log(`    marketId: '${price.marketId}',`);
    console.log(`    current: ${price.current},`);
    console.log(`    average: ${price.average},`);
    console.log(`    highest: ${price.highest},`);
    console.log(`    lowest: ${price.lowest},`);
    console.log(`    lastUpdated: new Date(Date.now() - ${Math.floor((Date.now() - price.lastUpdated.getTime()) / (60 * 60 * 1000))} * 60 * 60 * 1000),`);
    console.log(`    trend: '${price.trend}',`);
    console.log(`    history: generatePriceHistory(${price.current}),`);
    console.log(`    rating: ${price.rating},`);
    console.log(`    totalRatings: ${price.totalRatings}`);
    console.log(`  }${index < priceData.length - 1 ? ',' : ''}`);
  });
  
  console.log('];');
};

// Export example usage
export const exampleUsage = () => {
  console.log('=== Auto Price Generator Examples ===\n');
  
  console.log('1. Generate prices for all products:');
  console.log('   const allPrices = generateAllPrices();');
  console.log('');
  
  console.log('2. Generate prices for specific products:');
  console.log("   const bananaPrices = generatePricesForProducts(['p9', 'p10', 'p11']);");
  console.log('');
  
  console.log('3. Generate prices only for products missing data:');
  console.log('   const missingPrices = generateMissingPrices(existingPriceData);');
  console.log('');
  
  console.log('4. Print to console for copying:');
  console.log('   printGeneratedPrices(allPrices);');
};
