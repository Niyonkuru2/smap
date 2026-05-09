// src/services/productService.js
import pool from '../config/database.js';
import adminReferencePriceService from './adminReferencePriceService.js';

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
     * Get product with reference prices
     */
    async getProductWithReferencePrices(productId, marketId = null) {
        const product = await this.getProductById(productId);
        if (!product) return null;

        let referencePrices = [];
        if (marketId) {
            const refPrice = await adminReferencePriceService.getCurrentReferencePrice(productId, marketId);
            if (refPrice) {
                referencePrices = [refPrice];
            }
        } else {
            const result = await adminReferencePriceService.getAllReferencePrices({
                product_id: productId,
                is_current: true
            });
            referencePrices = result.data;
        }

        return {
            ...product,
            reference_prices: referencePrices
        };
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
     * Create product and set reference price in one operation
     */
    async createProductWithReferencePrice(productData, referencePriceData, adminId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Create product
            const product = await this.createProduct(productData);
            
            // Set reference price
            const referencePrice = await adminReferencePriceService.setReferencePrice({
                product_id: product.id,
                market_id: referencePriceData.market_id,
                price: referencePriceData.price,
                unit: product.unit,
                effective_date: referencePriceData.effective_date || new Date(),
                expiry_date: referencePriceData.expiry_date || null,
                notes: referencePriceData.notes || 'Initial reference price',
                admin_id: adminId
            });
            
            await client.query('COMMIT');
            
            return {
                product,
                reference_price: referencePrice.data
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating product with reference price:', error);
            throw error;
        } finally {
            client.release();
        }
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
                COUNT(DISTINCT category_id) as total_categories,
                (
                    SELECT COUNT(*) 
                    FROM reference_prices 
                    WHERE is_current = true
                ) as total_reference_prices
            FROM products
        `);
        return result.rows[0];
    }

    /**
     * Search products with filters
     */
    async searchProducts(searchTerm, categoryId = null, limit = 20) {
        let query = `
            SELECT p.id, p.name, p.category_id, p.unit, 
                   c.name as category_name,
                   EXISTS(
                       SELECT 1 FROM reference_prices rp 
                       WHERE rp.product_id = p.id AND rp.is_current = true
                   ) as has_reference_price
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.name ILIKE $1
        `;
        const params = [`%${searchTerm}%`];
        let paramCounter = 2;

        if (categoryId) {
            query += ` AND p.category_id = $${paramCounter++}`;
            params.push(categoryId);
        }

        query += ` ORDER BY p.name LIMIT $${paramCounter++}`;
        params.push(limit);

        const result = await pool.query(query, params);
        return result.rows;
    }
}

export default new ProductService();