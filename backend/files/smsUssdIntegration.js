/**
 * SMS/USSD Integration Module
 * Enables non-smartphone users to access prices via SMS and USSD
 */

import twilio from 'twilio';
import { db } from './database.js';
import * as mlPrediction from './mlPrediction.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+250728845885';

console.log('SMS/USSD Configuration:');
console.log('  Twilio Account:', process.env.TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ NOT SET');
console.log('  Twilio Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET');
console.log('  Twilio Phone:', TWILIO_PHONE);

/**
 * Send SMS message
 */
export async function sendSMS(toPhone, message) {
    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE,
            to: toPhone
        });
        
        console.log(`📱 SMS sent to ${toPhone}: ${result.sid}`);
        return {
            success: true,
            messageId: result.sid,
            status: result.status
        };
    } catch (error) {
        console.error('SMS send error:', error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
}

/**
 * Format product price for SMS response
 */
export function formatPriceSMS(product, prices) {
    if (!prices || prices.length === 0) {
        return `No prices available for ${product.name}`;
    }
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return `${product.name}\nAvg: ${Math.round(avgPrice)} RWF\nMin: ${minPrice} RWF\nMax: ${maxPrice} RWF`;
}

/**
 * Handle incoming SMS query for prices
 * Commands:
 * - "PRICE tomato" -> Get average price for tomatoes
 * - "MARKET kimironko" -> Get all markets info
 * - "COMPARE tomato" -> Compare tomato prices across markets
 * - "SUBMIT vendor_name product price" -> Submit price (for vendors via SMS)
 */
export async function handleSMSQuery(fromPhone, message) {
    try {
        const parts = message.trim().split(/\s+/);
        const command = parts[0].toUpperCase();
        
        let response = '';
        
        switch (command) {
            case 'PRICE': {
                if (parts.length < 2) {
                    response = 'Usage: PRICE <product_name>';
                    break;
                }
                
                const productName = parts.slice(1).join(' ');
                
                // Get product by name
                const productResult = await db.query(
                    'SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1) LIMIT 1',
                    [`%${productName}%`]
                );
                
                if (productResult.rows.length === 0) {
                    response = `Product "${productName}" not found. Try "PRODUCTS" for list.`;
                    break;
                }
                
                const product = productResult.rows[0];
                
                // Get recent prices
                const pricesResult = await db.query(`
                    SELECT DISTINCT ON (market_id) price
                    FROM prices
                    WHERE product_id = $1 AND status = 'approved'
                    ORDER BY market_id, created_at DESC
                    LIMIT 20
                `, [product.id]);
                
                if (pricesResult.rows.length === 0) {
                    response = `No prices available for ${product.name}.`;
                    break;
                }
                
                const prices = pricesResult.rows.map(row => parseFloat(row.price));
                response = formatPriceSMS(product, prices);
                break;
            }
            
            case 'PRODUCTS': {
                const productsResult = await db.query(
                    'SELECT name, category FROM products ORDER BY name LIMIT 10'
                );
                
                response = 'Available Products:\n';
                response += productsResult.rows
                    .map(p => `• ${p.name} (${p.category})`)
                    .join('\n');
                break;
            }
            
            case 'MARKETS': {
                const marketsResult = await db.query(
                    'SELECT name, location FROM markets ORDER BY name LIMIT 10'
                );
                
                response = 'Markets:\n';
                response += marketsResult.rows
                    .map(m => `• ${m.name} - ${m.location}`)
                    .join('\n');
                break;
            }
            
            case 'COMPARE': {
                if (parts.length < 2) {
                    response = 'Usage: COMPARE <product_name>';
                    break;
                }
                
                const productName = parts.slice(1).join(' ');
                const productResult = await db.query(
                    'SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1) LIMIT 1',
                    [`%${productName}%`]
                );
                
                if (productResult.rows.length === 0) {
                    response = `Product "${productName}" not found.`;
                    break;
                }
                
                const product = productResult.rows[0];
                const comparison = await mlPrediction.compareMarketPrices(product.id);
                
                if (!comparison.success) {
                    response = 'Unable to compare prices at this time.';
                    break;
                }
                
                response = `${product.name} Across Markets:\n`;
                comparison.comparison.slice(0, 5).forEach(market => {
                    response += `${market.marketName}: ${Math.round(market.price)} RWF\n`;
                });
                break;
            }
            
            case 'SUBMIT': {
                // Format: SUBMIT product market price
                if (parts.length < 4) {
                    response = 'Usage: SUBMIT <product> <market> <price>';
                    break;
                }
                
                const price = parseFloat(parts[parts.length - 1]);
                const marketName = parts[parts.length - 2];
                const productName = parts.slice(1, parts.length - 2).join(' ');
                
                if (isNaN(price)) {
                    response = 'Invalid price. Please provide a numeric value.';
                    break;
                }
                
                try {
                    // Store SMS submission in database
                    await db.query(`
                        INSERT INTO prices (product_id, market_id, vendor_id, price, unit, notes, status, source)
                        VALUES (
                            (SELECT id FROM products WHERE LOWER(name) LIKE LOWER($1) LIMIT 1),
                            (SELECT id FROM markets WHERE LOWER(name) LIKE LOWER($2) LIMIT 1),
                            (SELECT id FROM users WHERE phone = $3 LIMIT 1),
                            $4,
                            'kg',
                            $5,
                            'pending',
                            'SMS'
                        )
                    `, [
                        `%${productName}%`,
                        `%${marketName}%`,
                        fromPhone,
                        price,
                        `SMS submission from ${fromPhone}`
                    ]);
                    
                    response = `✓ Price submitted: ${productName} at ${marketName} = ${price} RWF\nThanks!`;
                } catch (error) {
                    response = 'Error submitting price. Try again.';
                    console.error('SMS price submit error:', error);
                }
                break;
            }
            
            case 'HELP': {
                response = 'Commands:\nPRICE <product>\nMARKETS\nPRODUCTS\nCOMPARE <product>\nSUBMIT <product> <market> <price>\nHELP';
                break;
            }
            
            default: {
                response = 'Unknown command. Text HELP for available commands.';
            }
        }
        
        // Send response
        await sendSMS(fromPhone, response);
        
        // Log the SMS interaction
        await db.query(`
            INSERT INTO sms_logs (phone, command, response, timestamp)
            VALUES ($1, $2, $3, NOW())
        `, [fromPhone, message, response]);
        
        return {
            success: true,
            command,
            response
        };
    } catch (error) {
        console.error('SMS query handler error:', error);
        
        // Send error message
        try {
            await sendSMS(fromPhone, 'Error processing request. Try HELP for commands.');
        } catch (e) {
            console.error('Failed to send error SMS:', e);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Handle USSD session
 * USSD is stateful and uses *codes* like *384#
 */
export async function handleUSSDSession(sessionId, msisdn, userInput, sessionState = {}) {
    try {
        const menu = buildUSSDMenu(sessionState);
        
        // Update session state based on input
        if (userInput === '1') {
            sessionState.step = 'price_product_selection';
        } else if (userInput === '2') {
            sessionState.step = 'market_listing';
        } else if (userInput === '0') {
            return {
                continueSession: false,
                message: 'Thank you for using Smart Market Price System. Goodbye!'
            };
        }
        
        return {
            continueSession: true,
            sessionId,
            sessionState,
            message: menu
        };
    } catch (error) {
        console.error('USSD session error:', error);
        return {
            continueSession: false,
            message: 'Error. Please try again.'
        };
    }
}

/**
 * Build USSD menu based on session state
 */
function buildUSSDMenu(sessionState = {}) {
    const step = sessionState.step || 'main';
    
    const menus = {
        main: `Smart Market Price System
1. Check Product Price
2. Compare Markets
3. Submit Price
4. View Markets
0. Exit`,
        
        price_product_selection: `Select Product:
1. Tomatoes
2. Irish Potatoes
3. Onions
4. Beans
5. Rice
0. Back`,
        
        market_listing: `Available Markets:
1. Kimironko Market
2. Nyabugogo Market
3. Kicukiro Market
4. Ubwali Market
0. Back`
    };
    
    return menus[step] || menus.main;
}

/**
 * Handle incoming Twilio SMS webhook
 */
export async function handleTwilioWebhook(req, res) {
    try {
        const fromPhone = req.body.From;
        const messageBody = req.body.Body;
        
        // Handle the SMS query
        const result = await handleSMSQuery(fromPhone, messageBody);
        
        // Send Twilio 200 response to acknowledge receipt
        res.status(200).send('Message received');
        
        return result;
    } catch (error) {
        console.error('Twilio webhook error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
}

/**
 * Create SMS log table if not exists
 */
export async function initializeUSSDTables() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) NOT NULL,
                command VARCHAR(255),
                response TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ SMS logs table initialized');
    } catch (error) {
        console.error('Error initializing SMS tables:', error);
    }
}

export default {
    sendSMS,
    handleSMSQuery,
    handleUSSDSession,
    handleTwilioWebhook,
    initializeUSSDTables
};
