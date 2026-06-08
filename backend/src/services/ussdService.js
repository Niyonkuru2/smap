import pool from '../config/database.js';

class USSDService {
    async handleUSSDRequest(sessionId, phoneNumber, text) {
        try {
            console.log(`[USSD Request] Phone: ${phoneNumber}, Text: "${text}", Session: ${sessionId}`);
            
            if (!phoneNumber) {
                return this.endSession('Invalid request. Please try again.');
            }

            const user = await this.getOrCreateUser(phoneNumber);
            console.log(`[User] ID: ${user.id}, Name: ${user.name}`);

            const input = text ? text.split('*') : [];
            const level = input.length;
            
            if (!text || text === '') {
                return this.getConsumerMenu(user);
            }

            // Route based on navigation level
            switch (level) {
                case 1:
                    return this.handleMainMenuChoice(user, input[0]);
                case 2:
                    return this.handleLevel2(user, input[0], input[1]);
                case 3:
                    return this.handleLevel3(user, input[0], input[1], input[2]);
                case 4:
                    return this.handleLevel4(user, input[0], input[1], input[2], input[3]);
                default:
                    return this.getConsumerMenu(user);
            }
        } catch (error) {
            console.error('USSD Handler Error:', error);
            return this.endSession('Sorry, an error occurred. Please try again later.');
        }
    }

    async getOrCreateUser(phoneNumber) {
        try {
            // Try to find existing user by phone
            let result = await pool.query(
                `SELECT id, name, phone, role, email 
                 FROM users 
                 WHERE phone = $1`,
                [phoneNumber]
            );

            if (result.rows.length > 0) {
                return {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    phone: result.rows[0].phone,
                    role: result.rows[0].role,
                    email: result.rows[0].email
                };
            }

            // Create new user with required fields
            const defaultName = `Customer_${phoneNumber.slice(-4)}`;
            const generatedEmail = `ussd_${phoneNumber}@smartmarket.local`;
            const defaultPasswordHash = 'ussd_auto_generated_' + Date.now();
            
            result = await pool.query(
                `INSERT INTO users (
                    name, phone, role, email, password_hash, 
                    is_active, verified, registration_completed, created_at
                ) VALUES ($1, $2, $3, $4, $5, true, true, true, NOW())
                RETURNING id, name, phone, role, email`,
                [defaultName, phoneNumber, 'consumer', generatedEmail, defaultPasswordHash]
            );

            return {
                id: result.rows[0].id,
                name: result.rows[0].name,
                phone: result.rows[0].phone,
                role: result.rows[0].role,
                email: result.rows[0].email
            };
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            // Return a fallback user object
            return {
                id: null,
                name: 'Customer',
                phone: phoneNumber,
                role: 'consumer',
                email: null
            };
        }
    }

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
        console.log(`[Main Menu] Choice: ${choice}`);
        
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

    async getMarketList(user, action) {
        try {
            const result = await pool.query(
                `SELECT id, name, province 
                 FROM markets 
                 ORDER BY name`
            );
            
            if (result.rows.length === 0) {
                return this.endSession('No markets available. Please contact support.');
            }

            let message = `Choose a market:
──────────────────────────────\n`;
            result.rows.forEach((market, idx) => {
                const provinceInfo = market.province ? ` (${market.province})` : '';
                message += `${idx + 1}. ${market.name}${provinceInfo}\n`;
            });
            message += `\n0. Back to Main Menu`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching markets:', error);
            return this.endSession('Unable to fetch markets. Please try again.');
        }
    }

    async getProductListForComparison(user) {
        try {
            const result = await pool.query(
                `SELECT id, name, unit 
                 FROM products 
                 ORDER BY name`
            );
            
            if (result.rows.length === 0) {
                return this.endSession('No products available. Please contact support.');
            }

            let message = `Choose a product to compare:
──────────────────────────────\n`;
            result.rows.forEach((product, idx) => {
                message += `${idx + 1}. ${product.name}\n`;
            });
            message += `\n0. Back to Main Menu`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    async handleLevel2(user, mainChoice, secondChoice) {
        console.log(`[Level2] Main: ${mainChoice}, Second: ${secondChoice}`);
        
        // Handle Compare Markets (option 3)
        if (mainChoice === '3') {
            if (secondChoice === '0') {
                return this.getConsumerMenu(user);
            }
            return this.handleProductComparison(user, secondChoice);
        }
        
        // Handle Price (1) or Trend (2)
        if (secondChoice === '0') {
            return this.getConsumerMenu(user);
        }
        
        const action = mainChoice === '1' ? 'price' : 'trend';
        
        try {
            // Get all markets
            const markets = await pool.query(
                'SELECT id, name FROM markets ORDER BY name'
            );
            
            const marketIndex = parseInt(secondChoice) - 1;
            if (marketIndex < 0 || marketIndex >= markets.rows.length) {
                return this.getMarketList(user, action);
            }
            
            const selectedMarket = markets.rows[marketIndex];
            
            // Get products with latest prices for this market
            const productsQuery = `
                SELECT DISTINCT ON (p.id)
                    p.id,
                    p.name,
                    p.unit,
                    pr.price,
                    pr.created_at
                FROM products p
                INNER JOIN prices pr ON pr.product_id = p.id
                WHERE pr.market_id = $1
                AND pr.status = 'approved'
                ORDER BY p.id, pr.created_at DESC
            `;
            
            const products = await pool.query(productsQuery, [selectedMarket.id]);
            
            if (products.rows.length === 0) {
                return this.continueSession(
                    `No products available at ${selectedMarket.name}.\n\n0. Back to Markets\n00. Main Menu`
                );
            }
            
            let message = `Products at ${selectedMarket.name}:
──────────────────────────────\n`;
            products.rows.forEach((product, idx) => {
                const priceDisplay = product.price ? 
                    ` - ${Number(product.price).toLocaleString()} RWF/${product.unit || 'kg'}` : '';
                message += `${idx + 1}. ${product.name}${priceDisplay}\n`;
            });
            message += `\n0. Back to Markets\n00. Main Menu`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error in level2:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    async handleLevel3(user, mainChoice, secondChoice, thirdChoice) {
        console.log(`[Level3] Third: ${thirdChoice}`);
        
        const action = mainChoice === '1' ? 'price' : 'trend';
        
        if (thirdChoice === '0') {
            return this.getMarketList(user, action);
        }
        
        if (thirdChoice === '00') {
            return this.getConsumerMenu(user);
        }
        
        try {
            // Get selected market
            const markets = await pool.query(
                'SELECT id, name FROM markets ORDER BY name'
            );
            const marketIndex = parseInt(secondChoice) - 1;
            
            if (marketIndex < 0 || marketIndex >= markets.rows.length) {
                return this.getMarketList(user, action);
            }
            const selectedMarket = markets.rows[marketIndex];
            
            // Get products for this market
            const productsQuery = `
                SELECT DISTINCT ON (p.id)
                    p.id,
                    p.name,
                    p.unit,
                    pr.price,
                    pr.created_at
                FROM products p
                INNER JOIN prices pr ON pr.product_id = p.id
                WHERE pr.market_id = $1
                AND pr.status = 'approved'
                ORDER BY p.id, pr.created_at DESC
            `;
            
            const products = await pool.query(productsQuery, [selectedMarket.id]);
            const productIndex = parseInt(thirdChoice) - 1;
            
            if (productIndex < 0 || productIndex >= products.rows.length) {
                return this.continueSession('Invalid product selection.\n\n0. Back to Products\n00. Main Menu');
            }
            
            const selectedProduct = products.rows[productIndex];
            
            if (action === 'price') {
                return this.showPrice(user, selectedMarket, selectedProduct);
            } else {
                return this.showTrend(user, selectedMarket, selectedProduct);
            }
        } catch (error) {
            console.error('Error in level3:', error);
            return this.endSession('Unable to process your request. Please try again.');
        }
    }

    async handleLevel4(user, mainChoice, secondChoice, thirdChoice, fourthChoice) {
        console.log(`[Level4] Fourth: ${fourthChoice}`);
        
        switch (fourthChoice) {
            case '1': // Another product
                if (mainChoice === '3') {
                    return this.getProductListForComparison(user);
                } else {
                    return this.handleLevel2(user, mainChoice, secondChoice);
                }
                
            case '2': // Change market
                if (mainChoice === '3') {
                    return this.getConsumerMenu(user);
                } else {
                    return this.getMarketList(user, mainChoice === '1' ? 'price' : 'trend');
                }
                
            case '3': // Main menu
                return this.getConsumerMenu(user);
                
            case '0': // Back
                if (mainChoice === '3') {
                    return this.getProductListForComparison(user);
                } else {
                    return this.handleLevel2(user, mainChoice, secondChoice);
                }
                
            case '#': // Logout
                return this.logout(user);
                
            default:
                if (mainChoice === '3') {
                    return this.getProductListForComparison(user);
                } else {
                    return this.handleLevel2(user, mainChoice, secondChoice);
                }
        }
    }

    async handleProductComparison(user, productChoice) {
        try {
            const products = await pool.query(
                'SELECT id, name, unit FROM products ORDER BY name'
            );
            
            const productIndex = parseInt(productChoice) - 1;
            if (productIndex < 0 || productIndex >= products.rows.length) {
                return this.getProductListForComparison(user);
            }
            
            const selectedProduct = products.rows[productIndex];
            return this.showCompareMarkets(user, selectedProduct);
        } catch (error) {
            console.error('Error in product comparison:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    async showPrice(user, market, product) {
        const message = `Current Price
──────────────────────────────
Market: ${market.name}
Product: ${product.name}

Price: ${Number(product.price).toLocaleString()} RWF/${product.unit || 'kg'}
Last Updated: ${new Date(product.created_at).toLocaleDateString()}

──────────────────────────────
1. Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
        return this.continueSession(message);
    }

    async showTrend(user, market, product) {
        try {
            // Get price change history
            const history = await pool.query(
                `SELECT recorded_at, percentage_change, change_type
                 FROM price_change_history 
                 WHERE product_id = $1 AND market_id = $2 
                 ORDER BY recorded_at DESC 
                 LIMIT 7`,
                [product.id, market.id]
            );

            let trendMessage = '';
            const currentPrice = product.price;
            
            if (history.rows.length >= 2) {
                const totalChange = history.rows.reduce((sum, record) => {
                    return sum + (record.percentage_change || 0);
                }, 0);
                
                const changeSymbol = totalChange >= 0 ? '↑' : '↓';
                const trend = totalChange > 0 ? 'RISING' : (totalChange < 0 ? 'FALLING' : 'STABLE');
                
                trendMessage = `Price Trend (Recent)
──────────────────────────────
Market: ${market.name}
Product: ${product.name}

Current: ${Number(currentPrice).toLocaleString()} RWF
Recent Trend: ${changeSymbol} ${Math.abs(totalChange).toFixed(1)}%
Status: ${trend}

Recent Changes:
──────────────────────────────\n`;
                
                const last5 = history.rows.slice(0, 5);
                for (const record of last5) {
                    const date = new Date(record.recorded_at).toLocaleDateString();
                    const changeIcon = record.change_type === 'increase' ? '↑' : (record.change_type === 'decrease' ? '↓' : '→');
                    trendMessage += `${date}: ${changeIcon} ${Math.abs(record.percentage_change || 0).toFixed(1)}%\n`;
                }
            } else {
                trendMessage = `Price Trend
──────────────────────────────
Market: ${market.name}
Product: ${product.name}

Current: ${Number(currentPrice).toLocaleString()} RWF
Insufficient data for trend analysis
(Need more price history)`;
            }

            const message = `${trendMessage}

──────────────────────────────
1. Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Error in showTrend:', error);
            return this.showPrice(user, market, product);
        }
    }

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
                INNER JOIN markets m ON pr.market_id = m.id
                WHERE pr.product_id = $1
                AND pr.status = 'approved'
                AND pr.created_at = (
                    SELECT MAX(created_at) 
                    FROM prices p2 
                    WHERE p2.product_id = pr.product_id 
                    AND p2.market_id = pr.market_id
                    AND p2.status = 'approved'
                )
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

📊 All Markets:
──────────────────────────────\n`;
            
            // Show only top 8 markets to avoid overwhelming the user
            const displayMarkets = markets.slice(0, 8);
            for (const market of displayMarkets) {
                const isBest = market.id === bestMarket.id;
                if (isBest) {
                    message += `✓ ${market.name}: ${Number(market.price).toLocaleString()} RWF - BEST PRICE\n`;
                } else {
                    const priceDiff = ((market.price - bestMarket.price) / bestMarket.price * 100).toFixed(1);
                    message += `  ${market.name}: ${Number(market.price).toLocaleString()} RWF (${priceDiff}% higher)\n`;
                }
            }
            
            if (markets.length > 8) {
                message += `\n  ... and ${markets.length - 8} more markets`;
            }
            
            const savingsPercent = ((highestMarket.price - bestMarket.price) / highestMarket.price * 100).toFixed(0);
            message += `\n──────────────────────────────
Average: ${Math.round(avgPrice).toLocaleString()} RWF
Save ${savingsPercent}% at ${bestMarket.name}

──────────────────────────────
1. Compare Another Product
2. Main Menu

#. Logout`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error in showCompareMarkets:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    logout(user) {
        return this.endSession(`Goodbye ${user.name}! Thank you for using Smart Market!`);
    }

    continueSession(message) {
        return { type: 'continue', message };
    }

    endSession(message) {
        return { type: 'end', message };
    }
}

export default new USSDService();