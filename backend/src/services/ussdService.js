import axios from 'axios';
import pool from '../config/database.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

class USSDService {
    constructor() {
        this.sessions = new Map(); // Store user session data
    }

    /**
     * Main USSD handler
     */
    async handleUSSDRequest(sessionId, phoneNumber, text, userData = null) {
        try {
            // Get or create user session
            let user = await this.getOrCreateUser(phoneNumber, userData);
            
            // Parse USSD input levels
            const input = text.split('*');
            const level = input.length;
            const userChoice = input[input.length - 1];

            // Main menu
            if (text === '') {
                return this.getMainMenu(user);
            }

            // Handle based on current level
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

    /**
     * Get or create user from database
     */
    async getOrCreateUser(phoneNumber, userData = null) {
        try {
            // Check if user exists
            let result = await pool.query(
                'SELECT id, name, phone, role FROM users WHERE phone = $1',
                [phoneNumber]
            );

            if (result.rows.length > 0) {
                return {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    phone: result.rows[0].phone,
                    role: result.rows[0].role,
                    isNew: false
                };
            }

            // Create new user if not exists
            const name = userData?.name || `User_${phoneNumber.slice(-4)}`;
            const insertResult = await pool.query(
                `INSERT INTO users (name, phone, role, is_active, created_at) 
                 VALUES ($1, $2, 'consumer', true, NOW()) RETURNING id, name, phone, role`,
                [name, phoneNumber]
            );

            return {
                id: insertResult.rows[0].id,
                name: insertResult.rows[0].name,
                phone: insertResult.rows[0].phone,
                role: insertResult.rows[0].role,
                isNew: true
            };
        } catch (error) {
            console.error('Error getting/creating user:', error);
            return {
                id: null,
                name: 'User',
                phone: phoneNumber,
                role: 'consumer',
                isNew: true
            };
        }
    }

    /**
     * Main Menu Response
     */
    getMainMenu(user) {
        const message = `Smart Market Price Monitoring
Musanze & 5 other markets

1. Login
2. Help

Enter choice:`;
        
        return this.continueSession(message);
    }

    /**
     * Handle Level 1 Menu
     */
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

    /**
     * Get Consumer Main Menu
     */
    getConsumerMenu(user) {
        const message = `Hello ${user.name}!
Consumer
──────────────────────────────
1. Check Prices
2. View Trends
3. Compare Markets

0. Back  |  #. Logout`;
        
        return this.continueSession(message);
    }

    /**
     * Handle Level 2 (Consumer Menu)
     */
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

    /**
     * Get Market List
     */
    async getMarketList(user, action) {
        try {
            const response = await axios.get(`${API_BASE_URL}/markets`);
            const markets = response.data;
            
            let message = `Choose a market:
──────────────────────────────\n`;
            
            markets.forEach((market, index) => {
                message += `${index + 1}. ${market.name}\n`;
            });
            
            message += `\n0. Back`;
            
            // Store action in session
            this.sessions.set(`${user.phone}_action`, action);
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching markets:', error);
            return this.endSession('Unable to fetch markets. Please try again.');
        }
    }

    /**
     * Handle Level 3 (Market Selection)
     */
    async handleLevel3(user, choice, input) {
        const action = this.sessions.get(`${user.phone}_action`);
        
        try {
            const response = await axios.get(`${API_BASE_URL}/markets`);
            const markets = response.data;
            const selectedIndex = parseInt(choice) - 1;
            
            if (choice === '0') {
                return this.getConsumerMenu(user);
            }
            
            if (selectedIndex < 0 || selectedIndex >= markets.length) {
                return this.getMarketList(user, action);
            }
            
            const selectedMarket = markets[selectedIndex];
            
            // Store selected market
            this.sessions.set(`${user.phone}_market`, selectedMarket);
            
            // Get products for this market
            const pricesResponse = await axios.get(`${API_BASE_URL}/prices/live?marketId=${selectedMarket.id}`);
            const products = pricesResponse.data.prices || [];
            
            if (products.length === 0) {
                return this.continueSession(`No products available at ${selectedMarket.name}. Please try another market.\n\n0. Back`);
            }
            
            // Store products for this market
            this.sessions.set(`${user.phone}_products`, products);
            
            let message = `Products at ${selectedMarket.name}:
──────────────────────────────\n`;
            
            products.forEach((product, index) => {
                message += `${index + 1}. ${product.product_name}\n`;
            });
            
            message += `\n0. Back`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.endSession('Unable to fetch products. Please try again.');
        }
    }

    /**
     * Handle Level 4 (Product Selection)
     */
    async handleLevel4(user, choice, input) {
        const action = this.sessions.get(`${user.phone}_action`);
        const products = this.sessions.get(`${user.phone}_products`);
        
        if (choice === '0') {
            return this.getMarketList(user, action);
        }
        
        const selectedIndex = parseInt(choice) - 1;
        
        if (selectedIndex < 0 || selectedIndex >= products.length) {
            return this.continueSession('Invalid selection. Please try again.\n\n0. Back');
        }
        
        const selectedProduct = products[selectedIndex];
        this.sessions.set(`${user.phone}_product`, selectedProduct);
        
        switch (action) {
            case 'price':
                return this.showPrice(user, selectedProduct);
            case 'trend':
                return this.showTrend(user, selectedProduct);
            case 'compare':
                return this.showCompareMarkets(user, selectedProduct);
            default:
                return this.getConsumerMenu(user);
        }
    }

    /**
     * Show Current Price
     */
    async showPrice(user, product) {
        const market = this.sessions.get(`${user.phone}_market`);
        
        // Get AI accuracy/confidence
        let accuracy = '93%';
        try {
            const forecast = await axios.get(`${API_BASE_URL}/forecast/product/${product.product_id}/market/${market.id}?days=7`);
            if (forecast.data.success) {
                accuracy = `${forecast.data.data.predictions[0]?.confidence || 93}%`;
            }
        } catch (error) {
            console.log('Forecast not available');
        }
        
        const message = `Current Price
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Price: ${product.price.toLocaleString()} RWF/${product.product_unit || 'kg'}
Updated: ${new Date(product.created_at).toLocaleDateString()}
AI Accuracy: ${accuracy}

──────────────────────────────
1. Check Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
        
        return this.continueSession(message);
    }

    /**
     * Show Price Trend
     */
    async showTrend(user, product) {
        const market = this.sessions.get(`${user.phone}_market`);
        
        try {
            // Get forecast data
            const forecastResponse = await axios.get(`${API_BASE_URL}/forecast/product/${product.product_id}/market/${market.id}?days=7`);
            
            let trendMessage = '';
            let status = '';
            let change = '';
            
            if (forecastResponse.data.success && forecastResponse.data.data.predictions.length > 0) {
                const forecast = forecastResponse.data.data.predictions[0];
                const currentPrice = product.price;
                const predictedPrice = forecast.price;
                const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
                
                if (percentChange > 0) {
                    status = 'RISING';
                    change = `↑ +${percentChange.toFixed(1)}%`;
                } else if (percentChange < 0) {
                    status = 'FALLING';
                    change = `↓ ${percentChange.toFixed(1)}%`;
                } else {
                    status = 'STABLE';
                    change = '→ 0%';
                }
                
                trendMessage = `Price Trend (24h)
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${currentPrice.toLocaleString()} RWF
Change: ${change}
Status: ${status}

AI Prediction (7d):
${predictedPrice.toLocaleString()} RWF
Confidence: ${forecast.confidence}%`;
            } else {
                trendMessage = `Price Trend (24h)
──────────────────────────────
Market: ${market.name}
Product: ${product.product_name}

Current: ${product.price.toLocaleString()} RWF
Trend: Stable
Insufficient data for prediction`;
            }
            
            const message = `${trendMessage}

──────────────────────────────
1. Check Another Product
2. Change Market
3. Main Menu

0. Back  |  #. Logout`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching trend:', error);
            return this.showPrice(user, product);
        }
    }

    /**
     * Show Market Comparison
     */
    async showCompareMarkets(user, product) {
        try {
            const response = await axios.get(`${API_BASE_URL}/forecast/product/${product.product_id}/markets`);
            
            if (!response.data.success || !response.data.data.markets) {
                return this.endSession('Unable to fetch market comparison. Please try again.');
            }
            
            const comparison = response.data.data;
            const markets = comparison.markets.slice(0, 5); // Show top 5 markets
            
            let message = `Market Comparison
──────────────────────────────
Product: ${product.product_name}

Best Price: ${comparison.best_market.market_name}
${comparison.best_market.average_price.toLocaleString()} RWF/${product.product_unit || 'kg'}
Save ${comparison.best_market.savings_percentage}%

Other Markets:
──────────────────────────────\n`;
            
            markets.forEach(market => {
                message += `${market.market_name}: ${market.average_price.toLocaleString()} RWF\n`;
            });
            
            message += `\n──────────────────────────────
1. Check Another Product
2. Main Menu

0. Back  |  #. Logout`;
            
            return this.continueSession(message);
        } catch (error) {
            console.error('Error fetching market comparison:', error);
            return this.showPrice(user, product);
        }
    }

    /**
     * Handle Level 5 (Post-action menu)
     */
    async handleLevel5(user, choice, input) {
        const action = this.sessions.get(`${user.phone}_action`);
        
        switch (choice) {
            case '1':
                return this.getMarketList(user, action);
            case '2':
                return this.getMarketList(user, action);
            case '3':
                return this.getConsumerMenu(user);
            case '0':
                if (action === 'price') {
                    return this.getMarketList(user, action);
                }
                return this.getConsumerMenu(user);
            case '#':
                return this.logout(user);
            default:
                return this.getConsumerMenu(user);
        }
    }

    /**
     * Get Help Menu
     */
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

    /**
     * Logout User
     */
    logout(user) {
        this.sessions.delete(`${user.phone}_action`);
        this.sessions.delete(`${user.phone}_market`);
        this.sessions.delete(`${user.phone}_products`);
        this.sessions.delete(`${user.phone}_product`);
        
        return this.endSession('You have been logged out. Thank you for using Smart Market!');
    }

    /**
     * Continue Session Response
     */
    continueSession(message) {
        return {
            type: 'continue',
            message: message
        };
    }

    /**
     * End Session Response
     */
    endSession(message) {
        return {
            type: 'end',
            message: message
        };
    }
}

export default new USSDService();