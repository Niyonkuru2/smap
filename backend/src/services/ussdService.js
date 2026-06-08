import pool from '../config/database.js';

class USSDService {
    // Pagination settings
    ITEMS_PER_PAGE = 5;

    async handleUSSDRequest(sessionId, phoneNumber, text) {
        try {
            console.log(`[USSD Request] Phone: ${phoneNumber}, Text: "${text}", Session: ${sessionId}`);
            
            if (!phoneNumber) {
                return this.endSession('Invalid request. Please try again.');
            }

            const user = await this.getOrCreateUser(phoneNumber);
            console.log(`[User] ID: ${user.id}`);

            const input = text ? text.split('*') : [];
            const level = input.length;
            
            if (!text || text === '') {
                return this.getConsumerMenu();
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
                    return this.getConsumerMenu();
            }
        } catch (error) {
            console.error('USSD Handler Error:', error);
            return this.endSession('Sorry, an error occurred. Please try again later.');
        }
    }

    async getOrCreateUser(phoneNumber) {
        try {
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
            return {
                id: null,
                name: 'Customer',
                phone: phoneNumber,
                role: 'consumer',
                email: null
            };
        }
    }

    getConsumerMenu() {
        const message = `Smart Market Price Monitoring
----------------------------
Welcome!

1. Check Prices
2. View Trends
3. Compare Markets
4. Help

0. Exit
#. Logout`;
        return this.continueSession(message);
    }

    async handleMainMenuChoice(user, choice) {
        console.log(`[Main Menu] Choice: ${choice}`);
        
        switch (choice) {
            case '1':
                return this.getMarketList('price', 1);
            case '2':
                return this.getMarketList('trend', 1);
            case '3':
                return this.getProductListForComparison(1);
            case '4':
                return this.getHelpMenu();
            case '0':
                return this.endSession('Thank you for using Smart Market. Goodbye!');
            case '#':
                return this.logout();
            default:
                return this.getConsumerMenu();
        }
    }

    getHelpMenu() {
        const message = `Help - Smart Market
----------------------------
* Check Prices - View current market prices
* View Trends - 24hr price change + 3d AI prediction
* Compare Markets - Find best price for a product

Tips:
* Prices update daily
* Save up to 30pct by comparing markets

0. Back
00. Main Menu`;
        return this.continueSession(message);
    }

    async getMarketList(action, page = 1) {
        try {
            const result = await pool.query(
                `SELECT id, name, province 
                 FROM markets 
                 ORDER BY name`
            );
            
            const markets = result.rows;
            if (markets.length === 0) {
                return this.endSession('No markets available. Please contact support.');
            }

            const totalPages = Math.ceil(markets.length / this.ITEMS_PER_PAGE);
            const startIdx = (page - 1) * this.ITEMS_PER_PAGE;
            const endIdx = startIdx + this.ITEMS_PER_PAGE;
            const pageMarkets = markets.slice(startIdx, endIdx);

            let message = `Markets (Page ${page}/${totalPages})
----------------------------\n`;
            
            pageMarkets.forEach((market, idx) => {
                const globalIdx = startIdx + idx + 1;
                const provinceInfo = market.province ? ` [${market.province}]` : '';
                message += `${globalIdx}. ${market.name}${provinceInfo}\n`;
            });
            
            message += `\n----------------------------`;
            message += `\nSend market number`;
            
            if (page < totalPages) {
                message += `\nNext: 99`;
            }
            if (page > 1) {
                message += `\nPrev: 98`;
            }
            message += `\nBack: 0`;
            message += `\nMain: 00`;
            
            return this.continueSession(message, { action, page, totalPages, markets: markets.map(m => ({ id: m.id, name: m.name })) });
        } catch (error) {
            console.error('Error fetching markets:', error);
            return this.endSession('Unable to fetch markets. Please try again.');
        }
    }

    async getProductListForComparison(page = 1) {
        try {
            const result = await pool.query(
                `SELECT id, name, unit 
                 FROM products 
                 ORDER BY name`
            );
            
            const products = result.rows;
            if (products.length === 0) {
                return this.endSession('No products available. Please contact support.');
            }

            const totalPages = Math.ceil(products.length / this.ITEMS_PER_PAGE);
            const startIdx = (page - 1) * this.ITEMS_PER_PAGE;
            const endIdx = startIdx + this.ITEMS_PER_PAGE;
            const pageProducts = products.slice(startIdx, endIdx);

            let message = `Products (Page ${page}/${totalPages})
----------------------------\n`;
            
            pageProducts.forEach((product, idx) => {
                const globalIdx = startIdx + idx + 1;
                message += `${globalIdx}. ${product.name}\n`;
            });
            
            message += `\n----------------------------`;
            message += `\nSend product number`;
            
            if (page < totalPages) {
                message += `\nNext: 99`;
            }
            if (page > 1) {
                message += `\nPrev: 98`;
            }
            message += `\nBack: 0`;
            message += `\nMain: 00`;
            
            return this.continueSession(message, { products: products.map(p => ({ id: p.id, name: p.name, unit: p.unit })) });
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    async handleLevel2(user, mainChoice, secondChoice) {
        console.log(`[Level2] Main: ${mainChoice}, Second: ${secondChoice}`);
        
        // Handle pagination for Compare Markets
        if (mainChoice === '3') {
            if (secondChoice === '99') {
                return this.getProductListForComparison(2);
            }
            if (secondChoice === '98') {
                return this.getProductListForComparison(1);
            }
            if (secondChoice === '0') {
                return this.getConsumerMenu();
            }
            if (secondChoice === '00') {
                return this.getConsumerMenu();
            }
            return this.handleProductComparison(user, secondChoice);
        }
        
        // Handle pagination for Price/Trend
        if (secondChoice === '99') {
            return this.getMarketList(mainChoice === '1' ? 'price' : 'trend', 2);
        }
        if (secondChoice === '98') {
            return this.getMarketList(mainChoice === '1' ? 'price' : 'trend', 1);
        }
        if (secondChoice === '0') {
            return this.getConsumerMenu();
        }
        if (secondChoice === '00') {
            return this.getConsumerMenu();
        }
        
        const action = mainChoice === '1' ? 'price' : 'trend';
        
        try {
            const markets = await pool.query(
                'SELECT id, name FROM markets ORDER BY name'
            );
            
            const marketIndex = parseInt(secondChoice) - 1;
            if (marketIndex < 0 || marketIndex >= markets.rows.length) {
                return this.getMarketList(action, 1);
            }
            
            const selectedMarket = markets.rows[marketIndex];
            
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
            
            let message = `${selectedMarket.name}
----------------------------\n`;
            products.rows.forEach((product, idx) => {
                const priceDisplay = product.price ? 
                    ` - ${Number(product.price).toLocaleString()} RWF` : '';
                message += `${idx + 1}. ${product.name}${priceDisplay}\n`;
            });
            message += `\n----------------------------`;
            message += `\nSend product number`;
            message += `\nBack to Markets: 0`;
            message += `\nMain Menu: 00`;
            
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
            return this.getMarketList(action, 1);
        }
        
        if (thirdChoice === '00') {
            return this.getConsumerMenu();
        }
        
        try {
            const markets = await pool.query(
                'SELECT id, name FROM markets ORDER BY name'
            );
            const marketIndex = parseInt(secondChoice) - 1;
            
            if (marketIndex < 0 || marketIndex >= markets.rows.length) {
                return this.getMarketList(action, 1);
            }
            const selectedMarket = markets.rows[marketIndex];
            
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
                return this.showPrice(selectedMarket, selectedProduct);
            } else {
                return this.showTrend(selectedMarket, selectedProduct);
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
                    return this.getProductListForComparison(1);
                } else {
                    return this.handleLevel2(user, mainChoice, secondChoice);
                }
                
            case '2': // Change market
                if (mainChoice === '3') {
                    return this.getConsumerMenu();
                } else {
                    return this.getMarketList(mainChoice === '1' ? 'price' : 'trend', 1);
                }
                
            case '3': // Main menu
                return this.getConsumerMenu();
                
            case '0': // Back
                if (mainChoice === '3') {
                    return this.getProductListForComparison(1);
                } else {
                    return this.handleLevel2(user, mainChoice, secondChoice);
                }
                
            case '#': // Logout
                return this.logout();
                
            default:
                if (mainChoice === '3') {
                    return this.getProductListForComparison(1);
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
                return this.getProductListForComparison(1);
            }
            
            const selectedProduct = products.rows[productIndex];
            return this.showCompareMarkets(selectedProduct);
        } catch (error) {
            console.error('Error in product comparison:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    async showPrice(market, product) {
        const message = `Current Price
----------------------------
Location: ${market.name}
Product: ${product.name}

Price: ${Number(product.price).toLocaleString()} RWF/${product.unit || 'kg'}
Updated: ${new Date(product.created_at).toLocaleDateString()}

----------------------------
1. Another Product
2. Change Market
3. Main Menu

0. Back
#. Logout`;
        return this.continueSession(message);
    }

    async showTrend(market, product) {
        try {
            // Get 24-hour price change
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            
            const priceHistory = await pool.query(
                `SELECT price, created_at
                 FROM prices 
                 WHERE product_id = $1 AND market_id = $2 
                 AND status = 'approved'
                 ORDER BY created_at DESC 
                 LIMIT 2`,
                [product.id, market.id]
            );

            let priceChange = 0;
            let changeSymbol = '';
            let trend = 'STABLE';
            let prediction = product.price;

            if (priceHistory.rows.length >= 2) {
                const currentPrice = parseFloat(priceHistory.rows[0].price);
                const previousPrice = parseFloat(priceHistory.rows[1].price);
                priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
                changeSymbol = priceChange >= 0 ? '+' : '';
                trend = priceChange > 0.5 ? 'RISING' : (priceChange < -0.5 ? 'FALLING' : 'STABLE');
                
                // Simple AI prediction based on trend
                const changeRate = priceChange / 24; // per hour change
                const predictionChange = changeRate * 72; // 3 days prediction
                prediction = currentPrice * (1 + (predictionChange / 100));
            }

            const message = `Price Trend (24hr)
----------------------------
Location: ${market.name}
Product: ${product.name}

Current: ${Number(product.price).toLocaleString()} RWF
Change: ${changeSymbol}${Math.abs(priceChange).toFixed(1)}pct
Status: ${trend}

AI Prediction (3d):
${Math.round(prediction).toLocaleString()} RWF/${product.unit || 'kg'}

----------------------------
1. Another Product
2. Change Market
3. Main Menu

0. Back
#. Logout`;
            return this.continueSession(message);
        } catch (error) {
            console.error('Error in showTrend:', error);
            return this.showPrice(market, product);
        }
    }

    async showCompareMarkets(product) {
        try {
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
            const avgPrice = markets.reduce((sum, m) => sum + parseFloat(m.price), 0) / markets.length;
            
            let message = `Compare Markets
----------------------------
Product: ${product.name}

BEST PRICE:
- ${bestMarket.name}: ${Number(bestMarket.price).toLocaleString()} RWF/${product.unit || 'kg'}

All Markets:
----------------------------\n`;
            
            // Show markets with pagination (first 6)
            const displayMarkets = markets.slice(0, 6);
            for (const market of displayMarkets) {
                const isBest = market.id === bestMarket.id;
                if (!isBest) {
                    const priceDiff = ((market.price - bestMarket.price) / bestMarket.price * 100).toFixed(1);
                    message += `${market.name}: ${Number(market.price).toLocaleString()} RWF (+${priceDiff}pct)\n`;
                }
            }
            
            if (markets.length > 6) {
                message += `\n... and ${markets.length - 6} more markets`;
            }
            
            const savingsPercent = ((markets[markets.length - 1].price - bestMarket.price) / markets[markets.length - 1].price * 100).toFixed(0);
            message += `\n----------------------------
Average: ${Math.round(avgPrice).toLocaleString()} RWF
Save ${savingsPercent}pct at ${bestMarket.name}

----------------------------
1. Another Product
2. Main Menu

#. Logout`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error in showCompareMarkets:', error);
            return this.endSession('Unable to compare markets. Please try again.');
        }
    }

    logout() {
        return this.endSession(`Thank you for using Smart Market!`);
    }

    continueSession(message, data = null) {
        return { type: 'continue', message };
    }

    endSession(message) {
        return { type: 'end', message };
    }
}

export default new USSDService();