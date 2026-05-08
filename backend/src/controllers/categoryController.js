// src/controllers/categoryController.js
import pool from '../config/database.js';

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL AND category != ''
            ORDER BY category
        `);
        
        const categories = result.rows.map(row => row.category);
        
        res.json({
            success: true,
            message: 'Categories fetched successfully',
            data: categories
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
 * Get products by category
 */
export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        const result = await pool.query(`
            SELECT id, name, unit, category
            FROM products
            WHERE category = $1
            ORDER BY name
        `, [category]);
        
        res.json({
            success: true,
            message: 'Products fetched successfully',
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
 * Create new category (admin only)
 */
export const createCategory = async (req, res) => {
    try {
        const { category } = req.body;
        
        if (!category || category.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        res.json({
            success: true,
            message: 'Category validated successfully',
            data: { category: category.trim() }
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