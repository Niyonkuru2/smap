import pool from '../config/database.js';

class MarketService {
    /**
     * Get all markets
     */
    async getAllMarkets() {
        const result = await pool.query(
            `SELECT id, name, province, district, latitude, longitude, created_at, updated_at
             FROM markets
             ORDER BY name`
        );
        return result.rows;
    }

    /**
     * Get market by ID
     */
    async getMarketById(id) {
        const result = await pool.query(
            `SELECT id, name, province, district, latitude, longitude, created_at, updated_at
             FROM markets
             WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Create market
     */
    async createMarket(marketData) {
        const { id, name, province, district, latitude, longitude } = marketData;
        
        // Generate ID if not provided
        const marketId = id || name.toLowerCase().replace(/\s+/g, '_');
        
        const result = await pool.query(
            `INSERT INTO markets (id, name, province, district, latitude, longitude, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING *`,
            [marketId, name, province, district, latitude || null, longitude || null]
        );
        
        return result.rows[0];
    }

    /**
     * Update market
     */
    async updateMarket(id, marketData) {
        const { name, province, district, latitude, longitude } = marketData;
        
        const result = await pool.query(
            `UPDATE markets 
             SET name = COALESCE($1, name),
                 province = COALESCE($2, province),
                 district = COALESCE($3, district),
                 latitude = COALESCE($4, latitude),
                 longitude = COALESCE($5, longitude),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, province, district, latitude, longitude, id]
        );
        
        return result.rows[0];
    }

    /**
     * Delete market
     */
    async deleteMarket(id) {
        const result = await pool.query(
            `DELETE FROM markets WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Get markets by province
     */
    async getMarketsByProvince(province) {
        const result = await pool.query(
            `SELECT id, name, province, district, latitude, longitude
             FROM markets
             WHERE province = $1
             ORDER BY name`,
            [province]
        );
        return result.rows;
    }

    /**
     * Get market statistics
     */
    async getMarketStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_markets,
                COUNT(DISTINCT province) as total_provinces,
                COUNT(DISTINCT district) as total_districts
            FROM markets
        `);
        return result.rows[0];
    }
}

export default new MarketService();