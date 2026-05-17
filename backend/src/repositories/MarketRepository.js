// src/repositories/MarketRepository.js
import DatabaseService from '../services/DatabaseService.js';
import MarketModel from '../models/MarketModel.js';

class MarketRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getAll() {
        const result = await this.dbService.query('SELECT * FROM markets ORDER BY province, name');
        return result.rows.map(row => new MarketModel(row));
    }

    async findById(id) {
        const result = await this.dbService.query('SELECT * FROM markets WHERE id = $1', [id]);
        return result.rows[0] ? new MarketModel(result.rows[0]) : null;
    }

    // ============================================
    // NEW CRUD METHODS
    // ============================================

    /**
     * Create a new market
     */
    async create(marketData) {
        const { id, name, province, district, latitude, longitude } = marketData;
        
        const result = await this.dbService.query(
            `INSERT INTO markets (id, name, province, district, latitude, longitude, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING *`,
            [id, name, province, district, latitude || null, longitude || null]
        );
        
        return result.rows[0] ? new MarketModel(result.rows[0]) : null;
    }

    /**
     * Update an existing market
     */
    async update(id, marketData) {
        const { name, province, district, latitude, longitude } = marketData;
        
        const result = await this.dbService.query(
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
        
        return result.rows[0] ? new MarketModel(result.rows[0]) : null;
    }

    /**
     * Soft delete (deactivate) a market
     * Note: Add is_active column to markets table if needed
     */
    async softDelete(id) {
        // If you have an is_active column, uncomment this:
        // const result = await this.dbService.query(
        //     'UPDATE markets SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        //     [id]
        // );
        
        // If no is_active column, just return success (or implement hard delete)
        const market = await this.findById(id);
        if (!market) return null;
        
        // For now, we'll just return the market (soft delete would need is_active column)
        return market;
    }

    /**
     * Permanently delete a market
     */
    async permanentDelete(id) {
        await this.dbService.query(
            'DELETE FROM markets WHERE id = $1',
            [id]
        );
        return true;
    }

    /**
     * Get markets by province
     */
    async getByProvince(province) {
        const result = await this.dbService.query(
            'SELECT * FROM markets WHERE province = $1 ORDER BY name',
            [province]
        );
        return result.rows.map(row => new MarketModel(row));
    }

    /**
     * Search markets by name, district, or province
     */
    async search(searchTerm) {
        const result = await this.dbService.query(
            `SELECT * FROM markets 
             WHERE LOWER(name) LIKE LOWER($1) 
                OR LOWER(district) LIKE LOWER($1)
                OR LOWER(province) LIKE LOWER($1)
             ORDER BY province, name`,
            [`%${searchTerm}%`]
        );
        return result.rows.map(row => new MarketModel(row));
    }

    /**
     * Get market statistics
     */
    async getStats() {
        const result = await this.dbService.query(`
            SELECT 
                COUNT(*) as total_markets,
                COUNT(DISTINCT province) as total_provinces,
                COUNT(DISTINCT district) as total_districts,
                json_agg(DISTINCT province) as provinces,
                json_agg(DISTINCT district) as districts
            FROM markets
        `);
        
        const marketsByProvince = await this.dbService.query(`
            SELECT 
                province,
                json_agg(json_build_object('id', id, 'name', name, 'district', district)) as markets
            FROM markets
            GROUP BY province
            ORDER BY province
        `);
        
        return {
            ...result.rows[0],
            markets_by_province: marketsByProvince.rows
        };
    }

    /**
     * Check if market exists
     */
    async exists(id) {
        const result = await this.dbService.query(
            'SELECT 1 FROM markets WHERE id = $1 LIMIT 1',
            [id]
        );
        return result.rows.length > 0;
    }
    async getActive() {
        return this.getAll();
    }
}

export default new MarketRepository();