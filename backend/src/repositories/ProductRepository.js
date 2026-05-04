import DatabaseService from '../services/DatabaseService.js';
import ProductModel from '../models/ProductModel.js';

class ProductRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getAll() {
        const result = await this.dbService.query('SELECT * FROM products ORDER BY category, name');
        return result.rows.map(row => new ProductModel(row));
    }

    async findById(id) {
        const result = await this.dbService.query('SELECT * FROM products WHERE id = $1', [id]);
        return result.rows[0] ? new ProductModel(result.rows[0]) : null;
    }
}

export default new ProductRepository();