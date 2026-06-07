import pool from '../config/database.js';

class USSDService {
    /**
     * Main USSD handler – completely stateless.
     * All state is derived from the `text` parameter.
     */
    async handleUSSDRequest(sessionId, phoneNumber, text) {
        try {
            if (!phoneNumber) {
                return this.endSession('Invalid request. Please try again.');
            }

            // Create or fetch user
            const user = await this.getOrCreateUser(phoneNumber);

            const input = text ? text.split('*') : [];
            const level = input.length;
            
            // First request → show consumer menu directly
            if (!text || text === '') {
                return this.getConsumerMenu(user);
            }

            // Route based on navigation level
            switch (level) {
                case 1:
                    return this.handleMainMenuChoice(user, input[0]);
                case 2:
                    return this.handleMarketSelection(user, input[0], input[1]);
                case 3:
                    return this.handleProductSelection(user, input[0], input[1], input[2]);
                case 4:
                    return this.handlePostActionMenu(user, input[0], input[1], input[2], input[3]);
                default:
                    return this.getConsumerMenu(user);
            }
        } catch (error) {
            console.error('USSD Handler Error:', error);
            return this.endSession('Sorry, an error occurred. Please try again later.');
        }
    }

    // -------------------------------------------------------------------------
    // User management
    // -------------------------------------------------------------------------
    async getOrCreateUser(phoneNumber) {
        try {
            const result = await pool.query(
                'SELECT id, name, phone, role FROM users WHERE phone = $1',
                [phoneNumber]
            );

            if (result.rows.length > 0) {
                return {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    phone: result.rows[0].phone,
                    role: result.rows[0].role,
                };
            }

            // New user – assign a default friendly name
            const defaultName = `Customer_${phoneNumber.slice(-4)}`;
            const insertResult = await pool.query(
                `INSERT INTO users (name, phone, role, is_active, created_at)
                 VALUES ($1, $2, 'consumer', true, NOW())
                 RETURNING id, name, phone, role`,
                [defaultName, phoneNumber]
            );

            return {
                id: insertResult.rows[0].id,
                name: insertResult.rows[0].name,
                phone: insertResult.rows[0].phone,
                role: insertResult.rows[0].role,
            };
        } catch (error) {
            console.error('Error getting/creating user:', error);
            return {
                id: null,
                name: 'Customer',
                phone: phoneNumber,
                role: 'consumer',
            };
        }
    }

    // -------------------------------------------------------------------------
    // Main Menu (Level 1)
    // -------------------------------------------------------------------------
    getConsumerMenu(user) {
        const message = `Smart Market Price Monitoring
──────────────────────────────
Welcome ${user.name}!

1. Check Prices
2. View Trends
3. Compare Markets
4. Help

0. Exit  |  #. Logout`;
        return this.continueSession(message);
    }

    async handleMainMenuChoice(user, choice) {
        switch (choice) {
            case '1':
                return this.getMarketList(user, 'price');
            case '2':
                return this.getMarketList(user, 'trend');
            case '3':
                return this.getProductListForComparison(user);
            case '4':
                return this.getHelpMenu(user);
            case '0':
                return this.endSession('Thank you for using Smart Market. Goodbye!');
            case '#':
                return this.logout(user);
            default:
                return this.getConsumerMenu(user);
        }
    }

    getHelpMenu(user) {
        const message = `Help - Smart Market
──────────────────────────────
• Check Prices – View current market prices
• View Trends – 7‑day price change
• Compare Markets – Find best price for a product

Tips:
• Prices update daily
• Save up to 30% by comparing markets

0. Back | Main Menu`;
        return this.continueSession(message);
    }

    // -------------------------------------------------------------------------
    // Product List for Comparison (Level 2 for Compare Markets)
    // -------------------------------------------------------------------------
    async getProductListForComparison(user) {
        try {
            const result = await pool.query(
                `SELECT id, name, unit 
                 FROM products 
                 WHERE is_active = true 
                 ORDER BY name`
            );
            
            const products = result.rows;

            if (products.length === 0) {
                return this.endSession('No products available. Please contact support.');
            }

            let message = `Choose a product to compare:
──────────────────────────────\n`;
            products.forEach((product, idx) => {
                message += `${idx + 1}. ${product.name}\n`;
            });
            message += `\n0. Back to Main Menu`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Market List (Level 2 for Price/Trend)
    // -------------------------------------------------------------------------
    async getMarketList(user, action) {
        try {
            const result = await pool.query(
                'SELECT id, name, province FROM markets WHERE is_active = true ORDER BY name'
            );
            const markets = result.rows;

            if (markets.length === 0) {
                return this.endSession('No markets available. Please contact support.');
            }

            let message = `Choose a market:
──────────────────────────────\n`;
            markets.forEach((market, idx) => {
                message += `${idx + 1}. ${market.name} (${market.province || 'Rwanda'})\n`;
            });
            message += `\n0. Back to Main Menu`;
            
            // Store action in session data (using text isn't reliable, so we'll pass through level)
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching markets:', error);
            return this.endSession('Unable to fetch markets. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Market Selection Handler (Level 2 for Compare, Level 2-3 for Price/Trend)
    // -------------------------------------------------------------------------
    async handleMarketSelection(user, mainChoice, marketChoice) {
        // If coming from Compare Markets (option 3 at main menu), this is actually product selection
        if (mainChoice === '3') {
            return this.handleProductForComparison(user, marketChoice);
        }
        
        // For Price (1) or Trend (2) - market selection
        if (marketChoice === '0') {
            return this.getConsumerMenu(user);
        }
        
        const action = mainChoice === '1' ? 'price' : 'trend';
        
        try {
            const marketsResult = await pool.query(
                'SELECT id, name FROM markets WHERE is_active = true ORDER BY name'
            );
            const markets = marketsResult.rows;
            const selectedIdx = parseInt(marketChoice) - 1;

            if (selectedIdx < 0 || selectedIdx >= markets.length) {
                return this.getMarketList(user, action);
            }

            const selectedMarket = markets[selectedIdx];

            // Fetch products with latest price for this market
            const productsQuery = `
                SELECT DISTINCT ON (p.id)
                    p.id AS product_id,
                    p.name AS product_name,
                    p.unit,
                    pr.price,
                    pr.created_at,
                    pr.market_id
                FROM products p
                LEFT JOIN prices pr ON pr.product_id = p.id AND pr.market_id = $1
                WHERE p.is_active = true
                ORDER BY p.id, pr.created_at DESC
            `;
            const productsResult = await pool.query(productsQuery, [selectedMarket.id]);
            let products = productsResult.rows.filter(p => p.price !== null);

            if (products.length === 0) {
                return this.continueSession(`No products available at ${selectedMarket.name}.\n\n0. Back to Markets\n00. Main Menu`);
            }

            let message = `Products at ${selectedMarket.name}:
──────────────────────────────\n`;
            products.forEach((product, idx) => {
                message += `${idx + 1}. ${product.product_name}\n`;
            });
            message += `\n0. Back to Markets\n00. Main Menu`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Handle Product Selection for Price/Trend (Level 3)
    // -------------------------------------------------------------------------
    async handleProductSelection(user, mainChoice, marketChoice, productChoice) {
        const action = mainChoice === '1' ? 'price' : 'trend';
        
        if (productChoice === '0') {
            return this.getMarketList(user, action);
        }
        
        if (productChoice === '00') {
            return this.getConsumerMenu(user);
        }

        try {
            // Get markets list
            const marketsResult = await pool.query(
                'SELECT id, name FROM markets WHERE is_active = true ORDER BY name'
            );
            const markets = marketsResult.rows;
            const marketIdx = parseInt(marketChoice) - 1;
            
            if (marketIdx < 0 || marketIdx >= markets.length) {
                return this.getMarketList(user, action);
            }
            const selectedMarket = markets[marketIdx];

            // Get products for this market
            const productsQuery = `
                SELECT DISTINCT ON (p.id)
                    p.id AS product_id,
                    p.name AS product_name,
                    p.unit,
                    pr.price,
                    pr.created_at,
                    pr.market_id
                FROM products p
                LEFT JOIN prices pr ON pr.product_id = p.id AND pr.market_id = $1
                WHERE p.is_active = true AND pr.price IS NOT NULL
                ORDER BY p.id, pr.created_at DESC
            `;
            const productsResult = await pool.query(productsQuery, [selectedMarket.id]);
            const products = productsResult.rows;
            
            const productIdx = parseInt(productChoice) - 1;
            if (productIdx < 0 || productIdx >= products.length) {
                return this.continueSession('Invalid product selection.\n\n0. Back to Products\n00. Main Menu');
            }
            
            const selectedProduct = products[productIdx];

            if (action === 'price') {
                return this.showPrice(user, selectedMarket, selectedProduct);
            } else {
                return this.showTrend(user, selectedMarket, selectedProduct);
            }
        } catch (error) {
            console.error('Error in product selection:', error);
            return this.endSession('Unable to process your request. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Handle Product for Comparison (Level 2-3)
    // -------------------------------------------------------------------------
    async handleProductForComparison(user, productChoice) {
        if (productChoice === '0') {
            return this.getConsumerMenu(user);
        }

        try {
            // Get all active products
            const productsResult = await pool.query(
                'SELECT id, name, unit FROM products WHERE is_active = true ORDER BY name'
            );
            const products = productsResult.rows;
            
            const productIdx = parseInt(productChoice) - 1;
            if (productIdx < 0 || productIdx >= products.length) {
                return this.getProductListForComparison(user);
            }
            
            const selectedProduct = products[productIdx];
            return this.showCompareMarkets(user, selectedProduct);
        } catch (error) {
            console.error('Error in product comparison:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Show Price
    // -------------------------------------------------------------------------
    async showPrice(user, market, product) {
        const message = `Current Price
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Price: ${Number(product.price).toLocaleString()} RWF/${product.unit || 'kg'}
Last Updated: ${new Date(product.created_at).toLocaleDateString()}

──────────────────────────────
1. Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
        return this.continueSession(message);
    }

    // -------------------------------------------------------------------------
    // Show Trend (7 days history)
    // -------------------------------------------------------------------------
    async showTrend(user, market, product) {
        try {
            const history = await pool.query(
                `SELECT recorded_date, price 
                 FROM price_history 
                 WHERE product_id = $1 AND market_id = $2 
                 ORDER BY recorded_date DESC LIMIT 7`,
                [product.product_id, market.id]
            );

            let trendMessage = '';
            const currentPrice = product.price;
            
            if (history.rows.length >= 2) {
                const oldestPrice = history.rows[history.rows.length - 1].price;
                const percentChange = ((currentPrice - oldestPrice) / oldestPrice) * 100;
                const changeSymbol = percentChange >= 0 ? '↑' : '↓';
                const trend = percentChange > 0 ? 'RISING' : (percentChange < 0 ? 'FALLING' : 'STABLE');
                
                trendMessage = `Price Trend (7 days)
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${Number(currentPrice).toLocaleString()} RWF
7-day Change: ${changeSymbol} ${Math.abs(percentChange).toFixed(1)}%
Status: ${trend}

Price History:
──────────────────────────────\n`;
                
                // Show last 5 price points
                const last5 = history.rows.slice(0, 5);
                for (const record of last5) {
                    const date = new Date(record.recorded_date).toLocaleDateString();
                    trendMessage += `${date}: ${Number(record.price).toLocaleString()} RWF\n`;
                }
            } else {
                trendMessage = `Price Trend
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${Number(currentPrice).toLocaleString()} RWF
Insufficient data for trend analysis
(Need at least 2 price points)`;
            }

            const message = `${trendMessage}

──────────────────────────────
1. Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Trend error:', error);
            return this.showPrice(user, market, product);
        }
    }

    // -------------------------------------------------------------------------
    // Compare Markets for a Product
    // -------------------------------------------------------------------------
    async showCompareMarkets(user, product) {
        try {
            // Get latest price for each market for this product
            const compareQuery = `
                SELECT 
                    m.id,
                    m.name,
                    m.province,
                    pr.price,
                    pr.created_at
                FROM prices pr
                JOIN markets m ON pr.market_id = m.id
                WHERE pr.product_id = $1
                AND pr.created_at = (
                    SELECT MAX(created_at) 
                    FROM prices p2 
                    WHERE p2.product_id = pr.product_id 
                    AND p2.market_id = pr.market_id
                )
                AND m.is_active = true
                ORDER BY pr.price ASC
            `;
            const result = await pool.query(compareQuery, [product.id]);
            const markets = result.rows;

            if (markets.length === 0) {
                return this.endSession(`No price data available for ${product.name}.`);
            }

            const bestMarket = markets[0];
            const highestMarket = markets[markets.length - 1];
            const avgPrice = markets.reduce((sum, m) => sum + parseFloat(m.price), 0) / markets.length;
            
            let message = `Compare Markets
──────────────────────────────
Product: ${product.name}

💰 BEST PRICE:
${bestMarket.name}: ${Number(bestMarket.price).toLocaleString()} RWF/${product.unit || 'kg'}
${bestMarket.province ? `(${bestMarket.province})` : ''}

📊 Market Prices:
──────────────────────────────\n`;
            
            // Show all markets with prices
            for (const market of markets) {
                const priceDiff = ((market.price - bestMarket.price) / bestMarket.price * 100).toFixed(1);
                const isBest = market.id === bestMarket.id;
                message += `${isBest ? '✓ ' : '  '}${market.name}: ${Number(market.price).toLocaleString()} RWF`;
                if (priceDiff > 0 && !isBest) {
                    message += ` (${priceDiff}% higher)`;
                }
                message += `\n`;
            }
            
            message += `\n──────────────────────────────
Average Price: ${Math.round(avgPrice).toLocaleString()} RWF
You save ${Math.round(((highestMarket.price - bestMarket.price) / highestMarket.price) * 100)}% by buying at ${bestMarket.name}

──────────────────────────────
1. Compare Another Product
2. Main Menu

#. Logout`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Compare error:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Post-Action Menu Handler (Level 4)
    // -------------------------------------------------------------------------
    async handlePostActionMenu(user, mainChoice, marketChoice, productChoice, actionChoice) {
        // actionChoice is what user selects after seeing price/trend/compare
        // 1 = Another Product, 2 = Change Market, 3 = Main Menu, 0 = Back, # = Logout
        
        const originalMainChoice = mainChoice; // '1', '2', or '3'
        
        switch (actionChoice) {
            case '1': // Another Product
                if (originalMainChoice === '3') {
                    // Coming from compare, go back to product list for comparison
                    return this.getProductListForComparison(user);
                } else {
                    // Coming from price/trend, go back to product list for same market
                    return this.handleMarketSelection(user, originalMainChoice, marketChoice);
                }
                
            case '2': // Change Market
                if (originalMainChoice === '3') {
                    // For compare, change market doesn't make sense, go to main menu
                    return this.getConsumerMenu(user);
                } else {
                    // For price/trend, go back to market list
                    return this.getMarketList(user, originalMainChoice === '1' ? 'price' : 'trend');
                }
                
            case '3': // Main Menu
                return this.getConsumerMenu(user);
                
            case '0': // Back
                if (originalMainChoice === '3') {
                    return this.getProductListForComparison(user);
                } else {
                    // For price/trend, back to product list
                    return this.handleMarketSelection(user, originalMainChoice, marketChoice);
                }
                
            case '#': // Logout
                return this.logout(user);
                
            default:
                // If invalid choice, show appropriate previous menu
                if (originalMainChoice === '3') {
                    return this.getProductListForComparison(user);
                } else {
                    return this.handleMarketSelection(user, originalMainChoice, marketChoice);
                }
        }
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------
    logout(user) {
        return this.endSession(`Goodbye ${user.name}! You have been logged out. Thank you for using Smart Market!`);
    }

    // -------------------------------------------------------------------------
    // Response formatters
    // -------------------------------------------------------------------------
    continueSession(message) {
        return { type: 'continue', message };
    }

    endSession(message) {
        return { type: 'end', message };
    }
}

export default new USSDService();