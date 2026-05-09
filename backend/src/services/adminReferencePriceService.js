import pool from '../config/database.js';

class AdminReferencePriceService {
    /**
     * Create or update admin reference price (real/benchmark price)
     * This serves as the baseline for anomaly detection
     */
    async setReferencePrice(data) {
        const { 
            product_name, 
            product_id,
            market_id, 
            price, 
            unit, 
            category_id,
            effective_date = new Date(),
            expiry_date = null,
            notes = '',
            admin_id,
            category_name = null
        } = data;

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            let finalProductId = product_id;
            let finalCategoryId = category_id;
            let finalUnit = unit;

            // If product doesn't exist, create it first
            if (!finalProductId && product_name) {
                // Get or create category if provided
                if (category_name && !finalCategoryId) {
                    const categoryResult = await client.query(
                        `SELECT id FROM categories WHERE LOWER(name) = LOWER($1)`,
                        [category_name]
                    );
                    
                    if (categoryResult.rows.length === 0) {
                        // Create new category
                        const newCategory = await client.query(
                            `INSERT INTO categories (name, description, type, is_active)
                             VALUES ($1, $2, 'product', true)
                             RETURNING id`,
                            [category_name, `Auto-created category for ${product_name}`]
                        );
                        finalCategoryId = newCategory.rows[0].id;
                    } else {
                        finalCategoryId = categoryResult.rows[0].id;
                    }
                }

                // Check if product already exists
                const productResult = await client.query(
                    `SELECT id FROM products WHERE LOWER(name) = LOWER($1)`,
                    [product_name]
                );

                if (productResult.rows.length === 0) {
                    // Create new product
                    const newProduct = await client.query(
                        `INSERT INTO products (name, category_id, unit, description, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, NOW(), NOW())
                         RETURNING id`,
                        [product_name, finalCategoryId, finalUnit, `Admin reference price for ${product_name}`]
                    );
                    finalProductId = newProduct.rows[0].id;
                } else {
                    finalProductId = productResult.rows[0].id;
                    // Update product unit if needed
                    if (finalUnit) {
                        await client.query(
                            `UPDATE products SET unit = $1, updated_at = NOW() WHERE id = $2`,
                            [finalUnit, finalProductId]
                        );
                    }
                }
            }

            // Validate required fields
            if (!finalProductId) {
                throw new Error('Product ID or product name is required');
            }
            if (!market_id) {
                throw new Error('Market ID is required');
            }
            if (!price || price <= 0) {
                throw new Error('Valid price is required');
            }
            if (!admin_id) {
                throw new Error('Admin ID is required');
            }

            // Get product name for logging
            const productInfo = await client.query(
                `SELECT name, unit FROM products WHERE id = $1`,
                [finalProductId]
            );
            const productUnit = finalUnit || productInfo.rows[0]?.unit || 'unit';

            // Deactivate current reference price for this product and market
            await client.query(
                `UPDATE reference_prices 
                 SET is_current = false, updated_at = NOW()
                 WHERE product_id = $1 
                   AND market_id = $2 
                   AND is_current = true`,
                [finalProductId, market_id]
            );

            // Insert new reference price
            const result = await client.query(
                `INSERT INTO reference_prices (
                    product_id, market_id, price, unit, effective_date, expiry_date, 
                    notes, set_by, is_current, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
                RETURNING *`,
                [finalProductId, market_id, price, productUnit, effective_date, expiry_date, notes, admin_id]
            );

            // Log the action in price change history
            await client.query(
                `INSERT INTO price_change_history (
                    product_id, market_id, old_price, new_price, percentage_change, 
                    change_type, recorded_at
                ) VALUES ($1, $2, NULL, $3, 0, 'new', NOW())`,
                [finalProductId, market_id, price]
            );

            // Create notification for system
            await client.query(
                `INSERT INTO notifications (
                    user_id, title, message, type, notification_type, 
                    priority, data, created_at
                ) VALUES (
                    $1, $2, $3, 'info', 'system', 'normal', 
                    $4, NOW()
                )`,
                [
                    admin_id,
                    'Reference Price Updated',
                    `Reference price for ${productInfo.rows[0]?.name} in market ${market_id} set to ${price} ${productUnit}`,
                    JSON.stringify({
                        product_id: finalProductId,
                        market_id: market_id,
                        price: price,
                        unit: productUnit
                    })
                ]
            );

            await client.query('COMMIT');

            return {
                success: true,
                message: 'Reference price set successfully',
                data: {
                    id: result.rows[0].id,
                    product_id: finalProductId,
                    product_name: productInfo.rows[0]?.name,
                    market_id: market_id,
                    price: price,
                    unit: productUnit,
                    effective_date: effective_date,
                    is_current: true
                }
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error setting reference price:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update existing reference price
     */
    async updateReferencePrice(referencePriceId, data) {
        const { price, effective_date, expiry_date, notes, admin_id } = data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get current reference price info
            const currentRef = await client.query(
                `SELECT rp.*, p.name as product_name 
                 FROM reference_prices rp
                 JOIN products p ON p.id = rp.product_id
                 WHERE rp.id = $1`,
                [referencePriceId]
            );

            if (currentRef.rows.length === 0) {
                throw new Error('Reference price not found');
            }

            const oldPrice = currentRef.rows[0].price;

            // Update reference price
            const result = await client.query(
                `UPDATE reference_prices 
                 SET price = COALESCE($1, price),
                     effective_date = COALESCE($2, effective_date),
                     expiry_date = $3,
                     notes = COALESCE($4, notes),
                     updated_at = NOW()
                 WHERE id = $5
                 RETURNING *`,
                [price, effective_date, expiry_date, notes, referencePriceId]
            );

            // Log price change
            if (price && price !== oldPrice) {
                const percentageChange = ((price - oldPrice) / oldPrice) * 100;
                
                await client.query(
                    `INSERT INTO price_change_history (
                        product_id, market_id, old_price, new_price, 
                        percentage_change, change_type, recorded_at
                    ) VALUES ($1, $2, $3, $4, $5, 'update', NOW())`,
                    [
                        currentRef.rows[0].product_id,
                        currentRef.rows[0].market_id,
                        oldPrice,
                        price,
                        percentageChange
                    ]
                );

                // Create notification
                await client.query(
                    `INSERT INTO notifications (
                        user_id, title, message, type, notification_type, 
                        priority, data, created_at
                    ) VALUES (
                        $1, $2, $3, 'info', 'system', 'normal', 
                        $4, NOW()
                    )`,
                    [
                        admin_id,
                        'Reference Price Updated',
                        `Reference price for ${currentRef.rows[0].product_name} updated from ${oldPrice} to ${price}`,
                        JSON.stringify({
                            reference_price_id: referencePriceId,
                            old_price: oldPrice,
                            new_price: price
                        })
                    ]
                );
            }

            await client.query('COMMIT');

            return {
                success: true,
                message: 'Reference price updated successfully',
                data: result.rows[0]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating reference price:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get current reference price for a product in a market
     */
    async getCurrentReferencePrice(productId, marketId) {
        const result = await pool.query(
            `SELECT rp.*, p.name as product_name, m.name as market_name
             FROM reference_prices rp
             JOIN products p ON p.id = rp.product_id
             JOIN markets m ON m.id = rp.market_id
             WHERE rp.product_id = $1 
               AND rp.market_id = $2 
               AND rp.is_current = true
               AND (rp.expiry_date IS NULL OR rp.expiry_date >= CURRENT_DATE)
             ORDER BY rp.effective_date DESC
             LIMIT 1`,
            [productId, marketId]
        );
        return result.rows[0];
    }

    /**
     * Get all reference prices with filters
     */
    async getAllReferencePrices(filters = {}) {
        const { product_id, market_id, is_current = true, limit = 100, offset = 0 } = filters;
        
        let query = `
            SELECT rp.*, 
                   p.name as product_name, 
                   p.unit as product_unit,
                   m.name as market_name,
                   u.name as set_by_name
            FROM reference_prices rp
            JOIN products p ON p.id = rp.product_id
            JOIN markets m ON m.id = rp.market_id
            LEFT JOIN users u ON u.id = rp.set_by
            WHERE 1=1
        `;
        const params = [];
        let paramCounter = 1;

        if (product_id) {
            query += ` AND rp.product_id = $${paramCounter++}`;
            params.push(product_id);
        }
        if (market_id) {
            query += ` AND rp.market_id = $${paramCounter++}`;
            params.push(market_id);
        }
        if (is_current !== undefined) {
            query += ` AND rp.is_current = $${paramCounter++}`;
            params.push(is_current);
        }

        query += ` ORDER BY rp.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) FROM reference_prices rp WHERE 1=1`;
        const countParams = [];
        let countCounter = 1;
        
        if (product_id) {
            countQuery += ` AND product_id = $${countCounter++}`;
            countParams.push(product_id);
        }
        if (market_id) {
            countQuery += ` AND market_id = $${countCounter++}`;
            countParams.push(market_id);
        }
        if (is_current !== undefined) {
            countQuery += ` AND is_current = $${countCounter++}`;
            countParams.push(is_current);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        
        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
        };
    }

    /**
     * Get price comparison for a product (reference vs actual vendor prices)
     */
    async getPriceComparison(productId, marketId) {
        const referencePrice = await this.getCurrentReferencePrice(productId, marketId);
        
        const vendorPrices = await pool.query(
            `SELECT p.*, u.name as vendor_name
             FROM prices p
             JOIN users u ON u.id = p.vendor_id
             WHERE p.product_id = $1 
               AND p.market_id = $2 
               AND p.status = 'approved'
               AND p.created_at >= NOW() - INTERVAL '30 days'
             ORDER BY p.created_at DESC`,
            [productId, marketId]
        );

        const stats = await pool.query(
            `SELECT 
                COUNT(*) as total_submissions,
                AVG(price) as avg_price,
                MIN(price) as min_price,
                MAX(price) as max_price,
                STDDEV(price) as price_stddev
             FROM prices
             WHERE product_id = $1 
               AND market_id = $2 
               AND status = 'approved'
               AND created_at >= NOW() - INTERVAL '30 days'`,
            [productId, marketId]
        );

        return {
            reference_price: referencePrice,
            vendor_prices: vendorPrices.rows,
            statistics: stats.rows[0]
        };
    }

    /**
     * Bulk import reference prices
     */
    async bulkImportReferencePrices(prices, admin_id) {
        const client = await pool.connect();
        const results = [];
        const errors = [];

        try {
            await client.query('BEGIN');

            for (const priceData of prices) {
                try {
                    const result = await this.setReferencePrice({
                        ...priceData,
                        admin_id
                    });
                    results.push(result.data);
                } catch (error) {
                    errors.push({
                        data: priceData,
                        error: error.message
                    });
                }
            }

            if (errors.length === 0) {
                await client.query('COMMIT');
                return {
                    success: true,
                    message: `Successfully imported ${results.length} reference prices`,
                    data: results,
                    errors: []
                };
            } else {
                await client.query('ROLLBACK');
                return {
                    success: false,
                    message: `Failed to import ${errors.length} reference prices`,
                    data: results,
                    errors: errors
                };
            }

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in bulk import:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete reference price (soft delete by setting is_current to false)
     */
    async deleteReferencePrice(referencePriceId, admin_id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE reference_prices 
                 SET is_current = false, 
                     updated_at = NOW(),
                     expiry_date = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [referencePriceId]
            );

            if (result.rows.length === 0) {
                throw new Error('Reference price not found');
            }

            await client.query('COMMIT');

            return {
                success: true,
                message: 'Reference price deleted successfully',
                data: result.rows[0]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting reference price:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new AdminReferencePriceService();