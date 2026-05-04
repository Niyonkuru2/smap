import DatabaseService from '../services/DatabaseService.js';
import FavoriteModel from '../models/FavoriteModel.js';

class FavoriteRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getByUser(userId) {
        const result = await this.dbService.query(
            `SELECT f.*, pr.name as product_name, m.name as market_name
             FROM favorites f
             LEFT JOIN products pr ON f.product_id = pr.id
             LEFT JOIN markets m ON f.market_id = m.id
             WHERE f.user_id = $1`,
            [userId]
        );
        return result.rows.map(row => new FavoriteModel(row));
    }

    async add(userId, productId, marketId) {
        const result = await this.dbService.query(
            `INSERT INTO favorites (user_id, product_id, market_id) VALUES ($1, $2, $3) RETURNING *`,
            [userId, productId, marketId]
        );
        return new FavoriteModel(result.rows[0]);
    }

    async remove(userId, productId, marketId) {
        await this.dbService.query(
            `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 AND market_id = $3`,
            [userId, productId, marketId]
        );
        return { success: true };
    }
}

export default new FavoriteRepository();