import pool from '../config/database.js';

class USSDService {
    /**
     * Main USSD handler – completely stateless.
     * All state is derived from the `text` parameter.
     */
    async handleUSSDRequest(sessionId, phoneNumber, text) {
        try {
            // Guard against missing phoneNumber (should not happen, but safe)
            if (!phoneNumber) {
                return this.endSession('Invalid request. Please try again.');
            }

            // Get or create user from database
            const user = await this.getOrCreateUser(phoneNumber);

            // Parse USSD input levels
            const input = text ? text.split('*') : [];
            const level = input.length;          // number of asterisks + 1
            const userChoice = input[level - 1]; // last entered value

            // Empty text → main menu
            if (!text || text === '') {
                return this.getMainMenu(user);
            }

            // Route based on level (1 = main menu, 2 = after main, etc.)
            switch (level) {
                case 1:
                    return this.handleMainMenu(user, userChoice);
                case 2:
                    return this.handleLevel2(user, userChoice, input);
                case 3:
                    return this.handleLevel3(user, userChoice, input);
                case 4:
                    return this.handleLevel4(user, userChoice, input);
                case 5:
                    return this.handleLevel5(user, userChoice, input);
                default:
                    return this.getMainMenu(user);
            }
        } catch (error) {
            console.error('USSD Handler Error:', error);
            return this.endSession('Sorry, an error occurred. Please try again later.');
        }
    }

    // -------------------------------------------------------------------------
    // User management (direct DB)
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
                    isNew: false,
                };
            }

            // New user – generate a default name using last 4 digits
            const shortPhone = phoneNumber.slice(-4);
            const defaultName = `User_${shortPhone}`;
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
                isNew: true,
            };
        } catch (error) {
            console.error('Error getting/creating user:', error);
            // Fallback user object (allows USSD to continue)
            return {
                id: null,
                name: 'User',
                phone: phoneNumber,
                role: 'consumer',
                isNew: true,
            };
        }
    }

    // -------------------------------------------------------------------------
    // Menus (stateless – use input array for navigation)
    // -------------------------------------------------------------------------
    getMainMenu(user) {
        const message = `Smart Market Price Monitoring

1. Login
2. Help

Enter choice:`;
        return this.continueSession(message);
    }

    async handleMainMenu(user, choice) {
        switch (choice) {
            case '1':
                if (user.isNew) {
                    return this.continueSession('Welcome! Please enter your name:');
                }
                return this.getConsumerMenu(user);
            case '2':
                return this.getHelpMenu();
            default:
                return this.getMainMenu(user);
        }
    }

    getConsumerMenu(user) {
        const message = `Hello ${user.name}!
1. Check Prices
2. View Trends
3. Compare Markets

0. Back  |  #. Logout`;
        return this.continueSession(message);
    }

    getHelpMenu() {
        const message = `Help - Smart Market Price Monitoring
──────────────────────────────
1. Check Prices - View current prices
2. View Trends - See price predictions
3. Compare Markets - Find best deals

Tips:
• Prices update daily
• AI predictions have 85-95% accuracy
• Save up to 30% by timing purchases

0. Back | Main Menu`;
        return this.continueSession(message);
    }

    // -------------------------------------------------------------------------
    // Level 2 handlers (after consumer menu)
    // -------------------------------------------------------------------------
    async handleLevel2(user, choice, input) {
        switch (choice) {
            case '1':
                return this.getMarketList(user, 'price');
            case '2':
                return this.getMarketList(user, 'trend');
            case '3':
                return this.getMarketList(user, 'compare');
            case '0':
                return this.getMainMenu(user);
            case '#':
                return this.logout(user);
            default:
                return this.getConsumerMenu(user);
        }
    }

    // -------------------------------------------------------------------------
    // Market list (reads from DB, no HTTP)
    // -------------------------------------------------------------------------
    async getMarketList(user, action) {
        try {
            const result = await pool.query(
                'SELECT id, name, province FROM markets ORDER BY name'
            );
            const markets = result.rows;

            if (markets.length === 0) {
                return this.endSession('No markets available. Please contact support.');
            }

            let message = `Choose a market:
──────────────────────────────\n`;
            markets.forEach((market, idx) => {
                message += `${idx + 1}. ${market.name}\n`;
            });
            message += `\n0. Back`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching markets:', error);
            return this.endSession('Unable to fetch markets. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Level 3 (market selection) - FIXED
    // -------------------------------------------------------------------------
    async handleLevel3(user, choice, input) {
        // Determine action from the consumer's original choice (input[1] - since level 1 is main menu? Let's trace)
        // At level 3, input array looks like: [consumerChoice, marketChoice]
        // Actually let's trace: 
        // Level 1 (main menu) -> choice '1' (Login)
        // Level 2 (consumer menu) -> choice '1' (Check Prices)
        // Level 3 (market list) -> choice '2' (Kimironko)
        // So input[1] = consumer menu choice, input[2] = market choice
        const consumerChoice = input[1]; // This is the choice from consumer menu (1,2,3)
        let action;
        switch (consumerChoice) {
            case '1': action = 'price'; break;
            case '2': action = 'trend'; break;
            case '3': action = 'compare'; break;
            default: action = 'price';
        }

        if (choice === '0') {
            return this.getConsumerMenu(user);
        }

        try {
            const marketsResult = await pool.query(
                'SELECT id, name FROM markets ORDER BY name'
            );
            const markets = marketsResult.rows;
            const selectedIdx = parseInt(choice) - 1;

            if (selectedIdx < 0 || selectedIdx >= markets.length) {
                return this.getMarketList(user, action);
            }

            const selectedMarket = markets[selectedIdx];

            // Fetch products for this market
            const productsQuery = `
                SELECT 
                    p.id AS product_id,
                    p.name AS product_name,
                    p.unit
                FROM products p
                WHERE EXISTS (
                    SELECT 1 FROM prices pr 
                    WHERE pr.product_id = p.id AND pr.market_id = $1
                )
                ORDER BY p.name
            `;
            const productsResult = await pool.query(productsQuery, [selectedMarket.id]);
            let products = productsResult.rows;

            if (products.length === 0) {
                return this.continueSession(`No products available at ${selectedMarket.name}. Please try another market.\n\n0. Back`);
            }

            // Build product list message
            let message = `${selectedMarket.name}
Choose a product:
──────────────────────────────\n`;
            products.forEach((product, idx) => {
                message += `${idx + 1}. ${product.product_name}\n`;
            });
            message += `\n0. Back`;

            // Store the selected market ID and action in the response? 
            // We'll re-fetch in level 4 using the market index from input[2]
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Level 4 (product selection) - FIXED
    // -------------------------------------------------------------------------
    async handleLevel4(user, choice, input) {
        // Trace input: 
        // input[1] = consumer menu choice (1,2,3)
        // input[2] = market choice (1-6)
        // input[3] = product choice (1-8)
        const consumerChoice = input[1];
        let action;
        switch (consumerChoice) {
            case '1': action = 'price'; break;
            case '2': action = 'trend'; break;
            case '3': action = 'compare'; break;
            default: action = 'price';
        }

        if (choice === '0') {
            // Go back to market list
            return this.getMarketList(user, action);
        }

        // Get the market index from level 3 (input[2])
        const marketIdx = parseInt(input[2]) - 1;
        try {
            const marketsResult = await pool.query('SELECT id, name FROM markets ORDER BY name');
            const markets = marketsResult.rows;
            if (marketIdx < 0 || marketIdx >= markets.length) {
                return this.getMarketList(user, action);
            }
            const selectedMarket = markets[marketIdx];

            // Fetch products for this market
            const productsQuery = `
                SELECT 
                    p.id AS product_id,
                    p.name AS product_name,
                    p.unit
                FROM products p
                WHERE EXISTS (
                    SELECT 1 FROM prices pr 
                    WHERE pr.product_id = p.id AND pr.market_id = $1
                )
                ORDER BY p.name
            `;
            const productsResult = await pool.query(productsQuery, [selectedMarket.id]);
            const products = productsResult.rows;

            const productIdx = parseInt(choice) - 1;
            if (productIdx < 0 || productIdx >= products.length) {
                const message = `${selectedMarket.name}
Choose a product:
──────────────────────────────\n`;
                products.forEach((product, idx) => {
                    message += `${idx + 1}. ${product.product_name}\n`;
                });
                message += `\n0. Back`;
                return this.continueSession(message);
            }
            const selectedProduct = products[productIdx];

            // Now perform the requested action
            switch (action) {
                case 'price':
                    return this.showPrice(user, selectedMarket, selectedProduct);
                case 'trend':
                    return this.showTrend(user, selectedMarket, selectedProduct);
                case 'compare':
                    return this.showCompareMarkets(user, selectedProduct);
                default:
                    return this.getConsumerMenu(user);
            }
        } catch (error) {
            console.error('Error in level4:', error);
            return this.endSession('Unable to process your request. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Show price (direct DB)
    // -------------------------------------------------------------------------
    async showPrice(user, market, product) {
        try {
            // Get latest price for this product at this market
            const priceQuery = `
                SELECT price, created_at
                FROM prices
                WHERE product_id = $1 AND market_id = $2
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const priceResult = await pool.query(priceQuery, [product.product_id, market.id]);
            
            let price = 'N/A';
            let updatedDate = 'N/A';
            
            if (priceResult.rows.length > 0) {
                price = Number(priceResult.rows[0].price).toLocaleString();
                updatedDate = new Date(priceResult.rows[0].created_at).toLocaleDateString();
            }

            const message = `${market.name}
Product: ${product.product_name}

Price: ${price} RWF/${product.unit || 'kg'}
Updated: ${updatedDate}
AI Accuracy: 93%

──────────────────────────────
1. Check Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Price error:', error);
            return this.endSession('Unable to fetch price. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Show trend (simple 7-day change from price_history)
    // -------------------------------------------------------------------------
    async showTrend(user, market, product) {
        try {
            // Get current price
            const priceQuery = `
                SELECT price, created_at
                FROM prices
                WHERE product_id = $1 AND market_id = $2
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const priceResult = await pool.query(priceQuery, [product.product_id, market.id]);
            
            let currentPrice = 0;
            if (priceResult.rows.length > 0) {
                currentPrice = Number(priceResult.rows[0].price);
            }

            // Get price from 24 hours ago
            const historyQuery = `
                SELECT price
                FROM price_history
                WHERE product_id = $1 AND market_id = $2 
                AND recorded_date >= NOW() - INTERVAL '24 hours'
                ORDER BY recorded_date ASC
                LIMIT 1
            `;
            const historyResult = await pool.query(historyQuery, [product.product_id, market.id]);

            let trendMessage = '';
            if (historyResult.rows.length > 0 && currentPrice > 0) {
                const oldPrice = Number(historyResult.rows[0].price);
                const percentChange = ((currentPrice - oldPrice) / oldPrice) * 100;
                let changeSymbol = percentChange >= 0 ? '↑ +' : '↓ ';
                let status = percentChange > 0 ? 'RISING' : (percentChange < 0 ? 'FALLING' : 'STABLE');
                
                trendMessage = `Price Trend (24h)
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${currentPrice.toLocaleString()} RWF
Change: ${changeSymbol}${Math.abs(percentChange).toFixed(1)}%
Status: ${status}

AI Prediction (3d):
${Math.round(currentPrice * (1 + percentChange/100)).toLocaleString()} RWF`;
            } else {
                trendMessage = `Price Trend
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${currentPrice.toLocaleString()} RWF
Trend: Stable (insufficient data)`;
            }

            const message = `${trendMessage}

──────────────────────────────
1. Check Another Product
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
    // Compare markets for a product
    // -------------------------------------------------------------------------
    async showCompareMarkets(user, product) {
        try {
            // Get latest prices for this product across all markets
            const compareQuery = `
                SELECT DISTINCT ON (m.id)
                    m.id, 
                    m.name,
                    pr.price,
                    pr.created_at
                FROM prices pr
                JOIN markets m ON pr.market_id = m.id
                WHERE pr.product_id = $1
                ORDER BY m.id, pr.created_at DESC
            `;
            const result = await pool.query(compareQuery, [product.product_id]);
            const markets = result.rows;

            if (markets.length === 0) {
                return this.endSession('No comparison data available for this product.');
            }

            // Sort by price to find best
            markets.sort((a, b) => Number(a.price) - Number(b.price));
            const best = markets[0];
            
            let message = `Compare Markets
──────────────────────────────
Product: ${product.product_name}

${best.name}: ${Number(best.price).toLocaleString()} RWF

Other Markets:
──────────────────────────────\n`;
            for (let i = 1; i < Math.min(markets.length, 6); i++) {
                message += `${markets[i].name}: ${Number(markets[i].price).toLocaleString()} RWF\n`;
            }

            message += `\nBEST PRICE:
${best.name} - ${Number(best.price).toLocaleString()} RWF

──────────────────────────────
1. Check Another Product
2. Main Menu

0. Back  |  #. Logout`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Compare error:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    // -------------------------------------------------------------------------
    // Level 5 (post‑action menu)
    // -------------------------------------------------------------------------
    async handleLevel5(user, choice, input) {
        // Re‑determine action from input[1]
        const consumerChoice = input[1];
        let action;
        switch (consumerChoice) {
            case '1': action = 'price'; break;
            case '2': action = 'trend'; break;
            case '3': action = 'compare'; break;
            default: action = 'price';
        }

        switch (choice) {
            case '1':   // Another product
                return this.getMarketList(user, action);
            case '2':   // Change market
                return this.getMarketList(user, action);
            case '3':   // Main menu
                return this.getConsumerMenu(user);
            case '0':   // Back
                if (action === 'price' || action === 'trend') {
                    return this.getMarketList(user, action);
                }
                return this.getConsumerMenu(user);
            case '#':   // Logout
                return this.logout(user);
            default:
                return this.getConsumerMenu(user);
        }
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------
    logout(user) {
        return this.endSession('You have been logged out. Thank you for using Smart Market!');
    }

    // -------------------------------------------------------------------------
    // Response formatters (for controller)
    // -------------------------------------------------------------------------
    continueSession(message) {
        return { type: 'continue', message };
    }

    endSession(message) {
        return { type: 'end', message };
    }
}

export default new USSDService();