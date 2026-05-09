// src/controllers/categoryController.js
import pool from '../config/database.js';

/**
 * Get all categories (from categories table)
 */
export const getAllCategories = async (req, res) => {
    try {
        // Get type filter from query params (optional)
        const { type } = req.query;
        
        let query = `
            SELECT id, name, description, type, parent_id, is_active, created_at, updated_at
            FROM categories 
            WHERE is_active = true
        `;
        const params = [];
        
        if (type && ['product', 'vendor', 'business', 'all'].includes(type)) {
            query += ` AND type = $1`;
            params.push(type);
        }
        
        query += ` ORDER BY name`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            message: 'Categories fetched successfully',
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT id, name, description, type, parent_id, is_active, created_at, updated_at
             FROM categories 
             WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category fetched successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            error: error.message
        });
    }
};

/**
 * Get products by category ID
 */
export const getProductsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First check if category exists
        const categoryCheck = await pool.query(
            'SELECT id, name FROM categories WHERE id = $1 AND type = $2',
            [id, 'product']
        );
        
        if (categoryCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product category not found'
            });
        }
        
        const result = await pool.query(`
            SELECT id, name, unit, description, image_url, created_at
            FROM products
            WHERE category_id = $1
            ORDER BY name
        `, [id]);
        
        res.json({
            success: true,
            message: 'Products fetched successfully',
            category: categoryCheck.rows[0],
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

/**
 * Get businesses by category ID
 */
export const getBusinessesByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if category exists
        const categoryCheck = await pool.query(
            'SELECT id, name FROM categories WHERE id = $1 AND type = $2',
            [id, 'business']
        );
        
        if (categoryCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Business category not found'
            });
        }
        
        const result = await pool.query(`
            SELECT bu.id, bu.business_name, bu.owner_name, bu.registration_number, 
                   bu.tier, bu.status, bu.rating, u.email, u.phone
            FROM business_users bu
            JOIN users u ON bu.user_id = u.id
            WHERE bu.category_id = $1
            ORDER BY bu.business_name
        `, [id]);
        
        res.json({
            success: true,
            message: 'Businesses fetched successfully',
            category: categoryCheck.rows[0],
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching businesses by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch businesses',
            error: error.message
        });
    }
};

/**
 * Create new category (admin only)
 */
export const createCategory = async (req, res) => {
    try {
        const { name, description, type, parent_id } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        
        const validTypes = ['product', 'vendor', 'business', 'all'];
        const categoryType = type && validTypes.includes(type) ? type : 'product';
        
        // Check if category already exists
        const existingCheck = await pool.query(
            'SELECT id FROM categories WHERE name = $1',
            [name.trim()]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Category already exists'
            });
        }
        
        // Validate parent_id if provided
        let validParentId = null;
        if (parent_id) {
            const parentCheck = await pool.query(
                'SELECT id FROM categories WHERE id = $1',
                [parent_id]
            );
            if (parentCheck.rows.length > 0) {
                validParentId = parent_id;
            }
        }
        
        const result = await pool.query(
            `INSERT INTO categories (name, description, type, parent_id, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, true, NOW(), NOW())
             RETURNING id, name, description, type, parent_id, is_active`,
            [name.trim(), description || null, categoryType, validParentId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
};

/**
 * Update category (admin only)
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, parent_id, is_active } = req.body;
        
        // Check if category exists
        const existingCheck = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );
        
        if (existingCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name.trim());
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description || null);
        }
        if (type !== undefined) {
            const validTypes = ['product', 'vendor', 'business', 'all'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category type'
                });
            }
            updates.push(`type = $${paramIndex++}`);
            values.push(type);
        }
        if (parent_id !== undefined) {
            updates.push(`parent_id = $${paramIndex++}`);
            values.push(parent_id || null);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        const result = await pool.query(
            `UPDATE categories 
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING id, name, description, type, parent_id, is_active`,
            values
        );
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
};

/**
 * Delete category (admin only - soft delete)
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE categories 
             SET is_active = false, updated_at = NOW()
             WHERE id = $1
             RETURNING id, name`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category deactivated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
};

/**
 * Get category tree (hierarchical)
 */
export const getCategoryTree = async (req, res) => {
    try {
        const { type } = req.query;
        
        let query = `
            WITH RECURSIVE category_tree AS (
                SELECT id, name, description, type, parent_id, is_active, 
                       0 as level, ARRAY[id] as path
                FROM categories
                WHERE parent_id IS NULL AND is_active = true
                ${type ? `AND type = '${type}'` : ''}
                
                UNION ALL
                
                SELECT c.id, c.name, c.description, c.type, c.parent_id, c.is_active,
                       ct.level + 1, ct.path || c.id
                FROM categories c
                INNER JOIN category_tree ct ON c.parent_id = ct.id
                WHERE c.is_active = true
            )
            SELECT id, name, description, type, parent_id, level
            FROM category_tree
            ORDER BY path
        `;
        
        const result = await pool.query(query);
        
        // Build tree structure
        const buildTree = (items, parentId = null) => {
            const nodes = [];
            for (const item of items) {
                if (item.parent_id === parentId) {
                    nodes.push({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        type: item.type,
                        children: buildTree(items, item.id)
                    });
                }
            }
            return nodes;
        };
        
        const tree = buildTree(result.rows);
        
        res.json({
            success: true,
            message: 'Category tree fetched successfully',
            data: tree
        });
    } catch (error) {
        console.error('Error fetching category tree:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category tree',
            error: error.message
        });
    }
};