// src/repositories/priceRepository.js
import pool from '../config/database.js';  // Using default import like UserRepository
import { 
    recordPrice, 
    getHistory, 
    calculateTrend, 
    forecastPrice,
    getSeasonalAnalysis,
    getMarketComparisonReport 
} from '../services/PriceService.js';

class PriceRepository {
    /**
     * Get all prices with optional filters
     */
    async getAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   pr.name as product_name, 
                   m.name as market_name,
                   u.name as vendor_name
            FROM prices p
            LEFT JOIN products pr ON p.product_id = pr.id
            LEFT JOIN markets m ON p.market_id = m.id
            LEFT JOIN users u ON p.vendor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.productId) {
            query += ` AND p.product_id = $${paramIndex++}`;
            params.push(filters.productId);
        }

        if (filters.marketId) {
            query += ` AND p.market_id = $${paramIndex++}`;
            params.push(filters.marketId);
        }

        if (filters.vendorId) {
            query += ` AND p.vendor_id = $${paramIndex++}`;
            params.push(filters.vendorId);
        }

        if (filters.status) {
            query += ` AND p.status = $${paramIndex++}`;
            params.push(filters.status);
        }

        query += ` ORDER BY p.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(filters.limit);
        }

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get price by ID
     */
    async getById(id) {
        const query = `
            SELECT p.*, 
                   pr.name as product_name, 
                   m.name as market_name,
                   u.name as vendor_name
            FROM prices p
            LEFT JOIN products pr ON p.product_id = pr.id
            LEFT JOIN markets m ON p.market_id = m.id
            LEFT JOIN users u ON p.vendor_id = u.id
            WHERE p.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get prices by product and market
     */
    async getByProductAndMarket(productId, marketId, limit = 10) {
        const query = `
            SELECT p.*, u.name as vendor_name
            FROM prices p
            LEFT JOIN users u ON p.vendor_id = u.id
            WHERE p.product_id = $1 AND p.market_id = $2
            ORDER BY p.created_at DESC
            LIMIT $3
        `;
        const result = await pool.query(query, [productId, marketId, limit]);
        return result.rows;
    }

    /**
     * Get latest price for a product at a market
     */
    async getLatestPrice(productId, marketId) {
        const query = `
            SELECT p.*, u.name as vendor_name
            FROM prices p
            LEFT JOIN users u ON p.vendor_id = u.id
            WHERE p.product_id = $1 AND p.market_id = $2
            ORDER BY p.created_at DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [productId, marketId]);
        return result.rows[0];
    }

    /**
     * Create new price record
     */
    async create(priceData) {
        const query = `
            INSERT INTO prices (
                product_id, market_id, vendor_id, price, 
                quantity, unit, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *
        `;
        const values = [
            priceData.product_id,
            priceData.market_id,
            priceData.vendor_id || null,
            priceData.price,
            priceData.quantity || 1,
            priceData.unit || 'kg',
            priceData.status || 'pending'
        ];
        const result = await pool.query(query, values);
        
        // Record in price history service
        if (priceData.status === 'approved') {
            recordPrice(
                priceData.product_id,
                priceData.market_id,
                priceData.price,
                priceData.vendor_id,
                { status: 'approved' }
            );
        }
        
        return result.rows[0];
    }

    /**
     * Update price record
     */
    async update(id, priceData) {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (priceData.price !== undefined) {
            updates.push(`price = $${paramIndex++}`);
            values.push(priceData.price);
        }
        if (priceData.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(priceData.status);
        }
        if (priceData.quantity !== undefined) {
            updates.push(`quantity = $${paramIndex++}`);
            values.push(priceData.quantity);
        }
        if (priceData.unit !== undefined) {
            updates.push(`unit = $${paramIndex++}`);
            values.push(priceData.unit);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE prices 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        const result = await pool.query(query, values);
        
        // Update price history if approved
        if (result.rows[0] && priceData.status === 'approved') {
            recordPrice(
                result.rows[0].product_id,
                result.rows[0].market_id,
                result.rows[0].price,
                result.rows[0].vendor_id,
                { status: 'approved', updated: true }
            );
        }
        
        return result.rows[0];
    }

    /**
     * Delete price record
     */
    async delete(id) {
        const query = `DELETE FROM prices WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get price history with analytics
     */
    async getPriceHistory(productId, marketId, options = {}) {
        // First try to get from database
        const dbHistory = await this.getByProductAndMarket(productId, marketId, options.limit || 100);
        
        if (dbHistory.length > 0) {
            return {
                productId,
                marketId,
                entries: dbHistory.map(h => ({
                    price: parseFloat(h.price),
                    timestamp: h.created_at,
                    vendorId: h.vendor_id,
                    vendorName: h.vendor_name
                })),
                count: dbHistory.length,
                source: 'database'
            };
        }
        
        // Fallback to in-memory history
        return getHistory(productId, marketId, options);
    }

    /**
     * Get price trend analysis
     */
    async getPriceTrend(productId, marketId, days = 7) {
        // Try to get from database first
        const dbHistory = await this.getByProductAndMarket(productId, marketId, 30);
        
        if (dbHistory.length >= 2) {
            // Calculate trend from database data
            const recentPrices = dbHistory.slice(0, Math.min(days, dbHistory.length));
            if (recentPrices.length >= 2) {
                const oldPrice = parseFloat(recentPrices[recentPrices.length - 1].price);
                const newPrice = parseFloat(recentPrices[0].price);
                const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
                
                let trend = 'stable';
                if (changePercent > 5) trend = 'rising';
                else if (changePercent < -5) trend = 'falling';
                
                return {
                    trend,
                    change: parseFloat(changePercent.toFixed(2)),
                    dataPoints: recentPrices.length,
                    confidence: recentPrices.length > 10 ? 'high' : recentPrices.length > 5 ? 'medium' : 'low',
                    period: `${days} days`,
                    source: 'database'
                };
            }
        }
        
        // Fallback to in-memory
        return calculateTrend(productId, marketId, days);
    }

    /**
     * Get price forecast
     */
    async getPriceForecast(productId, marketId, daysAhead = 7) {
        return forecastPrice(productId, marketId, daysAhead);
    }

    /**
     * Get seasonal analysis
     */
    async getSeasonalAnalysis(productId, marketId) {
        return getSeasonalAnalysis(productId, marketId);
    }

    /**
     * Get market comparison
     */
    async getMarketComparison(productId, markets) {
        return getMarketComparisonReport(productId, markets);
    }

    /**
     * Get current market prices
     */
    async getCurrentMarketPrices(productId) {
        const query = `
            SELECT DISTINCT ON (p.market_id) 
                   p.*, 
                   m.name as market_name,
                   m.location,
                   pr.name as product_name
            FROM prices p
            JOIN markets m ON p.market_id = m.id
            JOIN products pr ON p.product_id = pr.id
            WHERE p.product_id = $1 
              AND p.status = 'approved'
            ORDER BY p.market_id, p.created_at DESC
        `;
        const result = await pool.query(query, [productId]);
        return result.rows;
    }

    /**
     * Get price statistics for dashboard
     */
    async getPriceStats() {
        const query = `
            SELECT 
                COUNT(*) as total_prices,
                COUNT(DISTINCT product_id) as total_products,
                COUNT(DISTINCT market_id) as total_markets,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
            FROM prices
        `;
        const result = await pool.query(query);
        return result.rows[0];
    }
}

export default new PriceRepository();