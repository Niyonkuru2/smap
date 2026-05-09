// src/services/productService.js
import pool from '../config/database.js';

class ProductService {
    /**
     * Get all products
     */
    async getAllProducts() {
        const result = await pool.query(
            `SELECT p.id, p.name, p.category_id, p.unit, p.description, p.image_url, 
                    p.created_at, p.updated_at, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.name`
        );
        return result.rows;
    }

    /**
     * Get product by ID
     */
    async getProductById(id) {
        const result = await pool.query(
            `SELECT p.id, p.name, p.category_id, p.unit, p.description, p.image_url, 
                    p.created_at, p.updated_at, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Create product
     */
    async createProduct(productData) {
        const { name, category_id, unit, description, image_url } = productData;
        
        const result = await pool.query(
            `INSERT INTO products (name, category_id, unit, description, image_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING *`,
            [name, category_id, unit, description || null, image_url || null]
        );
        
        return result.rows[0];
    }

    /**
     * Update product
     */
    async updateProduct(id, productData) {
        const { name, category_id, unit, description, image_url } = productData;
        
        const result = await pool.query(
            `UPDATE products 
             SET name = COALESCE($1, name),
                 category_id = COALESCE($2, category_id),
                 unit = COALESCE($3, unit),
                 description = COALESCE($4, description),
                 image_url = COALESCE($5, image_url),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, category_id, unit, description, image_url, id]
        );
        
        return result.rows[0];
    }

    /**
     * Delete product
     */
    async deleteProduct(id) {
        const result = await pool.query(
            `DELETE FROM products WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId) {
        const result = await pool.query(
            `SELECT id, name, unit, description, image_url
             FROM products
             WHERE category_id = $1
             ORDER BY name`,
            [categoryId]
        );
        return result.rows;
    }

    /**
     * Get product statistics
     */
    async getProductStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(DISTINCT category_id) as total_categories
            FROM products
        `);
        return result.rows[0];
    }
}

export default new ProductService();