/**
 * SMS/USSD Gateway Service
 * Enables price queries and notifications for non-smartphone users
 */

// SMS Gateway configuration (supports Africa's Talking, Twilio, etc.)
export interface SMSConfig {
  provider: 'africas_talking' | 'twilio' | 'infobip' | 'local';
  apiKey: string;
  apiSecret?: string;
  senderId: string;
  shortCode?: string;
}

// USSD Session structure
export interface USSDSession {
  sessionId: string;
  phone: string;
  serviceCode: string;
  text: string;
  currentMenu: 'main' | 'markets' | 'products' | 'prices' | 'alerts' | 'help';
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// SMS Request types
export interface SMSRequest {
  phone: string;
  message: string;
  type: 'price_query' | 'price_alert' | 'verification' | 'notification';
}

// Price query result
export interface PriceQueryResult {
  product: string;
  market: string;
  price: number;
  unit: string;
  lastUpdated: string;
}

// USSD Menu responses
const USSD_MENUS = {
  main: `CON Welcome to SMPMPS
1. Check Prices
2. My Alerts
3. Register
4. Help`,

  markets: `CON Select Market:
1. Musanze Market
2. Kimironko Market
3. Nyabugogo Market
0. Back`,

  products: `CON Select Category:
1. Vegetables
2. Fruits
3. Grains
4. Meat
5. Dairy
0. Back`,

  vegetables: `CON Select Product:
1. Tomatoes
2. Onions
3. Carrots
4. Cabbage
0. Back`,

  fruits: `CON Select Product:
1. Bananas
2. Avocados
3. Mangoes
4. Oranges
0. Back`,

  grains: `CON Select Product:
1. Rice
2. Beans
3. Maize
4. Wheat Flour
0. Back`,

  alerts: `CON Price Alerts:
1. Set New Alert
2. My Active Alerts
3. Remove Alert
0. Back`,

  help: `END SMPMPS Help:
Send SMS "PRICE [product]" to get prices.
Example: PRICE TOMATOES
Call *123# for USSD menu.
Support: 0788123456`,
};

// Sample product prices (in production, fetch from database)
const SAMPLE_PRICES: Record<string, Record<string, PriceQueryResult>> = {
  musanze: {
    tomatoes: { product: 'Tomatoes', market: 'Musanze', price: 800, unit: 'kg', lastUpdated: '2026-02-12' },
    onions: { product: 'Onions', market: 'Musanze', price: 600, unit: 'kg', lastUpdated: '2026-02-12' },
    rice: { product: 'Rice', market: 'Musanze', price: 1500, unit: 'kg', lastUpdated: '2026-02-12' },
    beans: { product: 'Beans', market: 'Musanze', price: 900, unit: 'kg', lastUpdated: '2026-02-12' },
  },
  kimironko: {
    tomatoes: { product: 'Tomatoes', market: 'Kimironko', price: 850, unit: 'kg', lastUpdated: '2026-02-12' },
    onions: { product: 'Onions', market: 'Kimironko', price: 650, unit: 'kg', lastUpdated: '2026-02-12' },
    rice: { product: 'Rice', market: 'Kimironko', price: 1450, unit: 'kg', lastUpdated: '2026-02-12' },
    beans: { product: 'Beans', market: 'Kimironko', price: 950, unit: 'kg', lastUpdated: '2026-02-12' },
  },
  nyabugogo: {
    tomatoes: { product: 'Tomatoes', market: 'Nyabugogo', price: 750, unit: 'kg', lastUpdated: '2026-02-12' },
    onions: { product: 'Onions', market: 'Nyabugogo', price: 550, unit: 'kg', lastUpdated: '2026-02-12' },
    rice: { product: 'Rice', market: 'Nyabugogo', price: 1400, unit: 'kg', lastUpdated: '2026-02-12' },
    beans: { product: 'Beans', market: 'Nyabugogo', price: 880, unit: 'kg', lastUpdated: '2026-02-12' },
  },
};

// Active USSD sessions
const activeSessions = new Map<string, USSDSession>();

/**
 * Process incoming SMS message
 */
export function processSMSMessage(phone: string, message: string): string {
  const normalizedMessage = message.trim().toUpperCase();
  
  // Parse SMS commands
  if (normalizedMessage.startsWith('PRICE ')) {
    const product = normalizedMessage.replace('PRICE ', '').toLowerCase();
    return getPricesByProduct(product);
  }
  
  if (normalizedMessage.startsWith('MARKET ')) {
    const market = normalizedMessage.replace('MARKET ', '').toLowerCase();
    return getPricesByMarket(market);
  }
  
  if (normalizedMessage === 'HELP') {
    return `SMPMPS Commands:
PRICE [product] - Get prices
MARKET [name] - Market prices
ALERT [product] [price] - Set alert
STOP - Unsubscribe
Reply HELP for more info.`;
  }
  
  if (normalizedMessage.startsWith('ALERT ')) {
    const parts = normalizedMessage.replace('ALERT ', '').split(' ');
    if (parts.length >= 2) {
      const product = parts[0];
      const targetPrice = parseInt(parts[1]);
      return setAlert(phone, product, targetPrice);
    }
    return 'Invalid format. Use: ALERT [product] [price]\nExample: ALERT TOMATOES 700';
  }
  
  if (normalizedMessage === 'STOP') {
    return 'You have been unsubscribed from SMPMPS alerts. Send any message to resubscribe.';
  }
  
  // Default response
  return `Welcome to SMPMPS!
Send:
- PRICE [product]
- MARKET [market]
- HELP for commands
Or dial *123# for menu.`;
}

/**
 * Get prices for a specific product across all markets
 */
function getPricesByProduct(product: string): string {
  const results: string[] = [];
  
  for (const [marketId, products] of Object.entries(SAMPLE_PRICES)) {
    const productData = products[product];
    if (productData) {
      results.push(`${productData.market}: ${productData.price} RWF/${productData.unit}`);
    }
  }
  
  if (results.length === 0) {
    return `Product "${product}" not found. Try: tomatoes, onions, rice, beans`;
  }
  
  return `${product.toUpperCase()} Prices:\n${results.join('\n')}\nUpdated: Today`;
}

/**
 * Get all prices in a specific market
 */
function getPricesByMarket(marketName: string): string {
  const marketId = marketName.replace(' market', '').toLowerCase();
  const products = SAMPLE_PRICES[marketId];
  
  if (!products) {
    return `Market "${marketName}" not found. Try: Musanze, Kimironko, Nyabugogo`;
  }
  
  const results = Object.values(products).map(p => 
    `${p.product}: ${p.price} RWF/${p.unit}`
  );
  
  return `${marketName.toUpperCase()} Prices:\n${results.join('\n')}`;
}

/**
 * Set a price alert
 */
function setAlert(phone: string, product: string, targetPrice: number): string {
  // In production, save to database
  return `Alert set! You will receive SMS when ${product} drops below ${targetPrice} RWF.\nReply STOP to cancel alerts.`;
}

/**
 * Process USSD request
 */
export function processUSSDRequest(
  sessionId: string,
  phone: string,
  serviceCode: string,
  text: string
): string {
  // Get or create session
  let session = activeSessions.get(sessionId);
  
  if (!session) {
    session = {
      sessionId,
      phone,
      serviceCode,
      text: '',
      currentMenu: 'main',
      data: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    activeSessions.set(sessionId, session);
    return USSD_MENUS.main;
  }
  
  // Parse user input
  const inputs = text.split('*');
  const lastInput = inputs[inputs.length - 1];
  
  // Main menu
  if (inputs.length === 1) {
    switch (lastInput) {
      case '1': // Check Prices
        session.currentMenu = 'markets';
        return USSD_MENUS.markets;
      case '2': // My Alerts
        session.currentMenu = 'alerts';
        return USSD_MENUS.alerts;
      case '3': // Register
        return `END Registration:
Visit our website or send SMS "REGISTER" to register for price alerts.`;
      case '4': // Help
        return USSD_MENUS.help;
      default:
        return USSD_MENUS.main;
    }
  }
  
  // Market selection
  if (inputs.length === 2 && inputs[0] === '1') {
    const markets = ['musanze', 'kimironko', 'nyabugogo'];
    const marketIndex = parseInt(lastInput) - 1;
    
    if (lastInput === '0') {
      session.currentMenu = 'main';
      return USSD_MENUS.main;
    }
    
    if (marketIndex >= 0 && marketIndex < markets.length) {
      session.data.selectedMarket = markets[marketIndex];
      session.currentMenu = 'products';
      return USSD_MENUS.products;
    }
  }
  
  // Product category selection
  if (inputs.length === 3 && inputs[0] === '1') {
    const categories = ['vegetables', 'fruits', 'grains', 'meat', 'dairy'];
    const categoryIndex = parseInt(lastInput) - 1;
    
    if (lastInput === '0') {
      session.currentMenu = 'markets';
      return USSD_MENUS.markets;
    }
    
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      const category = categories[categoryIndex];
      session.data.selectedCategory = category;
      return USSD_MENUS[category as keyof typeof USSD_MENUS] || USSD_MENUS.vegetables;
    }
  }
  
  // Product selection - show price
  if (inputs.length === 4 && inputs[0] === '1') {
    const market = session.data.selectedMarket || 'musanze';
    const category = session.data.selectedCategory || 'vegetables';
    
    if (lastInput === '0') {
      return USSD_MENUS.products;
    }
    
    const productsByCategory: Record<string, string[]> = {
      vegetables: ['tomatoes', 'onions', 'carrots', 'cabbage'],
      fruits: ['bananas', 'avocados', 'mangoes', 'oranges'],
      grains: ['rice', 'beans', 'maize', 'wheat_flour'],
    };
    
    const products = productsByCategory[category] || productsByCategory.vegetables;
    const productIndex = parseInt(lastInput) - 1;
    
    if (productIndex >= 0 && productIndex < products.length) {
      const product = products[productIndex];
      const priceData = SAMPLE_PRICES[market]?.[product];
      
      if (priceData) {
        // Clean up session
        activeSessions.delete(sessionId);
        
        return `END ${priceData.product} @ ${priceData.market}
Price: ${priceData.price} RWF/${priceData.unit}
Updated: ${priceData.lastUpdated}

Dial *123# for more prices.`;
      }
    }
  }
  
  // Default fallback
  return USSD_MENUS.main;
}

/**
 * Send SMS notification
 */
export async function sendSMSNotification(
  phone: string,
  message: string,
  type: SMSRequest['type'] = 'notification'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production, integrate with SMS gateway (Africa's Talking, Twilio, etc.)
    console.log(`[SMS] Sending to ${phone}: ${message}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      messageId: `MSG_${Date.now()}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send price alert SMS
 */
export async function sendPriceAlertSMS(
  phone: string,
  product: string,
  market: string,
  currentPrice: number,
  targetPrice: number
): Promise<boolean> {
  const message = `SMPMPS Alert: ${product} at ${market} is now ${currentPrice} RWF (below your target of ${targetPrice} RWF). Reply STOP to unsubscribe.`;
  
  const result = await sendSMSNotification(phone, message, 'price_alert');
  return result.success;
}

/**
 * Format price message for SMS (keeping under 160 characters)
 */
export function formatPriceSMS(prices: PriceQueryResult[]): string {
  if (prices.length === 0) {
    return 'No prices found. Try another product.';
  }
  
  const lines = prices.map(p => `${p.market}: ${p.price}/${p.unit}`);
  const header = `${prices[0].product} Prices:`;
  
  // Ensure message fits in SMS limit
  let message = header;
  for (const line of lines) {
    if ((message + '\n' + line).length <= 155) {
      message += '\n' + line;
    }
  }
  
  return message;
}

export default {
  processSMSMessage,
  processUSSDRequest,
  sendSMSNotification,
  sendPriceAlertSMS,
  formatPriceSMS,
};
