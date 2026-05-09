import pool  from '../config/database.js';

class ReferencePriceService {
    async createProductWithReferencePrice(data, adminId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const {
                product_name,
                product_unit,
                product_description,
                category_id,
                product_image_url,
                market_id,
                reference_price,
                price_unit,
                effective_date,
                expiry_date,
                notes
            } = data;
            
            // Check if product already exists
            const existingProduct = await client.query(
                'SELECT id FROM products WHERE name = $1',
                [product_name]
            );
            
            let productId;
            let isExistingProduct = false;
            
            if (existingProduct.rows.length > 0) {
                productId = existingProduct.rows[0].id;
                isExistingProduct = true;
                
                // Check if reference price already exists for this product-market
                const existingRefPrice = await client.query(
                    `SELECT id FROM reference_prices 
                     WHERE product_id = $1 AND market_id = $2 AND is_current = true`,
                    [productId, market_id]
                );
                
                if (existingRefPrice.rows.length > 0) {
                    // Update existing reference price to inactive
                    await client.query(
                        `UPDATE reference_prices 
                         SET is_current = false, 
                             updated_at = CURRENT_TIMESTAMP 
                         WHERE product_id = $1 AND market_id = $2 AND is_current = true`,
                        [productId, market_id]
                    );
                }
            } else {
                // Create new product
                const newProduct = await client.query(
                    `INSERT INTO products (name, unit, description, image_url, category_id)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [product_name, product_unit, product_description, product_image_url, category_id]
                );
                productId = newProduct.rows[0].id;
            }
            
            // Insert reference price
            const newReferencePrice = await client.query(
                `INSERT INTO reference_prices 
                 (product_id, market_id, price, unit, effective_date, expiry_date, notes, set_by, is_current)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                 RETURNING *`,
                [
                    productId, 
                    market_id, 
                    reference_price, 
                    price_unit || product_unit, 
                    effective_date || new Date().toISOString().split('T')[0],
                    expiry_date || null,
                    notes || null,
                    adminId
                ]
            );
            
            await client.query('COMMIT');
            
            // Fetch complete data with joins
            const result = await client.query(
                `SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.unit as product_unit,
                    p.description,
                    p.image_url,
                    c.id as category_id,
                    c.name as category_name,
                    rp.id as reference_price_id,
                    rp.price as reference_price,
                    rp.unit as price_unit,
                    rp.effective_date,
                    rp.expiry_date,
                    rp.notes,
                    m.id as market_id,
                    m.name as market_name,
                    m.province,
                    m.district
                 FROM products p
                 LEFT JOIN categories c ON c.id = p.category_id
                 LEFT JOIN reference_prices rp ON rp.product_id = p.id AND rp.id = $1
                 LEFT JOIN markets m ON m.id = rp.market_id
                 WHERE p.id = $2`,
                [newReferencePrice.rows[0].id, productId]
            );
            
            return {
                success: true,
                message: isExistingProduct ? 
                    'Reference price added to existing product successfully' : 
                    'Product and reference price created successfully',
                data: result.rows[0]
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Set reference price for existing product
     */
    async setReferencePrice(data, adminId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const {
                product_id,
                market_id,
                price,
                unit,
                effective_date,
                expiry_date,
                notes
            } = data;
            
            // Check if product exists
            const product = await client.query(
                'SELECT id, name, unit FROM products WHERE id = $1',
                [product_id]
            );
            
            if (product.rows.length === 0) {
                throw new Error('Product not found');
            }
            
            // Check if market exists
            const market = await client.query(
                'SELECT id, name FROM markets WHERE id = $1',
                [market_id]
            );
            
            if (market.rows.length === 0) {
                throw new Error('Market not found');
            }
            
            // Set existing reference prices to inactive
            await client.query(
                `UPDATE reference_prices 
                 SET is_current = false, 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE product_id = $1 AND market_id = $2 AND is_current = true`,
                [product_id, market_id]
            );
            
            // Insert new reference price
            const result = await client.query(
                `INSERT INTO reference_prices 
                 (product_id, market_id, price, unit, effective_date, expiry_date, notes, set_by, is_current)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                 RETURNING *`,
                [
                    product_id,
                    market_id,
                    price,
                    unit || product.rows[0].unit,
                    effective_date || new Date().toISOString().split('T')[0],
                    expiry_date || null,
                    notes || null,
                    adminId
                ]
            );
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: 'Reference price set successfully',
                data: {
                    id: result.rows[0].id,
                    product_id: product_id,
                    product_name: product.rows[0].name,
                    market_id: market_id,
                    market_name: market.rows[0].name,
                    price: result.rows[0].price,
                    unit: result.rows[0].unit,
                    effective_date: result.rows[0].effective_date,
                    expiry_date: result.rows[0].expiry_date,
                    set_by: adminId,
                    created_at: result.rows[0].created_at
                }
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get reference prices with filters
     */
    async getReferencePrices(filters) {
        const { 
            product_id, 
            market_id, 
            is_current,
            page = 1, 
            limit = 20 
        } = filters;
        
        let query = `
            SELECT 
                rp.id,
                rp.price,
                rp.unit,
                rp.effective_date,
                rp.expiry_date,
                rp.notes,
                rp.is_current,
                rp.created_at,
                p.id as product_id,
                p.name as product_name,
                p.unit as product_unit,
                m.id as market_id,
                m.name as market_name,
                m.province,
                m.district,
                u.name as set_by_name
            FROM reference_prices rp
            JOIN products p ON p.id = rp.product_id
            JOIN markets m ON m.id = rp.market_id
            LEFT JOIN users u ON u.id = rp.set_by
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (product_id) {
            query += ` AND rp.product_id = $${paramIndex}`;
            params.push(product_id);
            paramIndex++;
        }
        
        if (market_id) {
            query += ` AND rp.market_id = $${paramIndex}`;
            params.push(market_id);
            paramIndex++;
        }
        
        if (is_current !== undefined) {
            query += ` AND rp.is_current = $${paramIndex}`;
            params.push(is_current === 'true');
            paramIndex++;
        }
        
        // Add ordering and pagination
        query += ` ORDER BY rp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (page - 1) * limit);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) FROM reference_prices rp WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        
        if (product_id) {
            countQuery += ` AND rp.product_id = $${countIndex}`;
            countParams.push(product_id);
            countIndex++;
        }
        
        if (market_id) {
            countQuery += ` AND rp.market_id = $${countIndex}`;
            countParams.push(market_id);
            countIndex++;
        }
        
        if (is_current !== undefined) {
            countQuery += ` AND rp.is_current = $${countIndex}`;
            countParams.push(is_current === 'true');
            countIndex++;
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = parseInt(totalResult.rows[0].count);
        
        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get single reference price by ID
     */
    async getReferencePriceById(id) {
        const result = await pool.query(
            `SELECT 
                rp.*,
                p.id as product_id,
                p.name as product_name,
                p.unit as product_unit,
                p.description as product_description,
                m.id as market_id,
                m.name as market_name,
                m.province,
                m.district,
                u.name as set_by_name
             FROM reference_prices rp
             JOIN products p ON p.id = rp.product_id
             JOIN markets m ON m.id = rp.market_id
             LEFT JOIN users u ON u.id = rp.set_by
             WHERE rp.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Reference price not found');
        }
        
        return result.rows[0];
    }

    /**
     * Update reference price
     */
    async updateReferencePrice(id, updateData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const { price, unit, effective_date, expiry_date, notes, is_current } = updateData;
            
            // Check if reference price exists
            const existing = await client.query(
                'SELECT * FROM reference_prices WHERE id = $1',
                [id]
            );
            
            if (existing.rows.length === 0) {
                throw new Error('Reference price not found');
            }
            
            // Build update query dynamically
            const updates = [];
            const params = [];
            let paramIndex = 1;
            
            if (price !== undefined) {
                updates.push(`price = $${paramIndex}`);
                params.push(price);
                paramIndex++;
            }
            
            if (unit !== undefined) {
                updates.push(`unit = $${paramIndex}`);
                params.push(unit);
                paramIndex++;
            }
            
            if (effective_date !== undefined) {
                updates.push(`effective_date = $${paramIndex}`);
                params.push(effective_date);
                paramIndex++;
            }
            
            if (expiry_date !== undefined) {
                updates.push(`expiry_date = $${paramIndex}`);
                params.push(expiry_date);
                paramIndex++;
            }
            
            if (notes !== undefined) {
                updates.push(`notes = $${paramIndex}`);
                params.push(notes);
                paramIndex++;
            }
            
            if (is_current !== undefined) {
                updates.push(`is_current = $${paramIndex}`);
                params.push(is_current);
                paramIndex++;
            }
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            
            if (updates.length === 1) {
                throw new Error('No fields to update');
            }
            
            params.push(id);
            
            const result = await client.query(
                `UPDATE reference_prices 
                 SET ${updates.join(', ')}
                 WHERE id = $${paramIndex}
                 RETURNING *`,
                params
            );
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: 'Reference price updated successfully',
                data: result.rows[0]
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete reference price
     */
    async deleteReferencePrice(id) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check if reference price exists
            const existing = await client.query(
                'SELECT id FROM reference_prices WHERE id = $1',
                [id]
            );
            
            if (existing.rows.length === 0) {
                throw new Error('Reference price not found');
            }
            
            // Delete reference price
            await client.query('DELETE FROM reference_prices WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: 'Reference price deleted successfully'
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Bulk set reference prices
     */
    async bulkSetReferencePrices(prices, adminId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const results = [];
            const errors = [];
            
            for (const item of prices) {
                try {
                    const { product_id, market_id, price, unit, effective_date, expiry_date, notes } = item;
                    
                    // Validate required fields
                    if (!product_id || !market_id || !price) {
                        errors.push({
                            item,
                            error: 'Missing required fields: product_id, market_id, price'
                        });
                        continue;
                    }
                    
                    // Set existing reference prices to inactive
                    await client.query(
                        `UPDATE reference_prices 
                         SET is_current = false, 
                             updated_at = CURRENT_TIMESTAMP 
                         WHERE product_id = $1 AND market_id = $2 AND is_current = true`,
                        [product_id, market_id]
                    );
                    
                    // Insert new reference price
                    const result = await client.query(
                        `INSERT INTO reference_prices 
                         (product_id, market_id, price, unit, effective_date, expiry_date, notes, set_by, is_current)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                         RETURNING id`,
                        [
                            product_id,
                            market_id,
                            price,
                            unit || 'kg',
                            effective_date || new Date().toISOString().split('T')[0],
                            expiry_date || null,
                            notes || null,
                            adminId
                        ]
                    );
                    
                    results.push({
                        product_id,
                        market_id,
                        reference_price_id: result.rows[0].id,
                        status: 'success'
                    });
                    
                } catch (itemError) {
                    errors.push({
                        item,
                        error: itemError.message
                    });
                }
            }
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: `Processed ${prices.length} items. Success: ${results.length}, Errors: ${errors.length}`,
                data: {
                    successful: results,
                    errors: errors
                }
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get products with their reference prices
     */
    async getProductsWithPrices(filters) {
        const { market_id, category_id, search, page = 1, limit = 20 } = filters;
        
        let query = `
            SELECT 
                p.id,
                p.name,
                p.unit,
                p.description,
                p.image_url,
                c.id as category_id,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'market_id', m.id,
                            'market_name', m.name,
                            'province', m.province,
                            'district', m.district,
                            'reference_price', rp.price,
                            'reference_price_id', rp.id,
                            'effective_date', rp.effective_date,
                            'expiry_date', rp.expiry_date,
                            'is_current', rp.is_current
                        )
                    ) FILTER (WHERE rp.id IS NOT NULL),
                    '[]'::json
                ) as reference_prices
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN reference_prices rp ON rp.product_id = p.id AND rp.is_current = true
            LEFT JOIN markets m ON m.id = rp.market_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (market_id) {
            query += ` AND rp.market_id = $${paramIndex}`;
            params.push(market_id);
            paramIndex++;
        }
        
        if (category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(category_id);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND p.name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` GROUP BY p.id, c.id ORDER BY p.name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (page - 1) * limit);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(DISTINCT p.id) FROM products p WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        
        if (category_id) {
            countQuery += ` AND p.category_id = $${countIndex}`;
            countParams.push(category_id);
            countIndex++;
        }
        
        if (search) {
            countQuery += ` AND p.name ILIKE $${countIndex}`;
            countParams.push(`%${search}%`);
            countIndex++;
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = parseInt(totalResult.rows[0].count);
        
        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get reference price statistics
     */
    async getReferencePriceStatistics() {
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT rp.product_id) as total_products_with_prices,
                COUNT(DISTINCT rp.market_id) as total_markets_with_prices,
                COUNT(*) as total_reference_prices,
                COUNT(*) FILTER (WHERE rp.is_current = true) as current_reference_prices,
                COUNT(*) FILTER (WHERE rp.expiry_date < CURRENT_DATE) as expired_prices,
                COUNT(*) FILTER (WHERE rp.effective_date > CURRENT_DATE) as future_prices,
                ROUND(AVG(rp.price)::numeric, 2) as average_price,
                MIN(rp.price) as min_price,
                MAX(rp.price) as max_price
            FROM reference_prices rp
        `);
        
        // Get top products by reference price count
        const topProducts = await pool.query(`
            SELECT 
                p.name as product_name,
                COUNT(rp.id) as price_count,
                COUNT(DISTINCT rp.market_id) as market_count,
                ROUND(AVG(rp.price)::numeric, 2) as avg_price
            FROM reference_prices rp
            JOIN products p ON p.id = rp.product_id
            GROUP BY p.id, p.name
            ORDER BY price_count DESC
            LIMIT 10
        `);
        
        return {
            summary: result.rows[0],
            top_products: topProducts.rows
        };
    }
}

export default new ReferencePriceService();