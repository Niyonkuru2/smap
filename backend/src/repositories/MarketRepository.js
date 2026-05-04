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
}

export default new MarketRepository();