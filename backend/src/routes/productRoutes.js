import express from 'express';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = [
            { id: 1, name: 'Tomatoes', category: 'Vegetables', unit: 'kg' },
            { id: 2, name: 'Onions', category: 'Vegetables', unit: 'kg' },
            { id: 3, name: 'Potatoes', category: 'Vegetables', unit: 'kg' },
            { id: 4, name: 'Rice', category: 'Grains', unit: 'kg' },
            { id: 5, name: 'Beans', category: 'Legumes', unit: 'kg' }
        ];
        
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            product: { id: parseInt(id), name: 'Tomatoes', category: 'Vegetables', unit: 'kg' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Dairy', 'Legumes'];
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product prices
router.get('/prices/all', async (req, res) => {
    try {
        const products = Object.entries({
            'Tomatoes': { base: 800, unit: 'kg', volatility: 0.35 },
            'Rice': { base: 1800, unit: 'kg', volatility: 0.15 }
        }).map(([name, info]) => ({
            name,
            base_price: info.base,
            unit: info.unit,
            volatility: Math.round(info.volatility * 100) + '%'
        }));
        
        res.json({ success: true, products, total: products.length, currency: 'RWF' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Create product
router.post('/', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { name, category, unit, description, imageUrl } = req.body;
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: { id: Date.now(), name, category, unit, description, imageUrl }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update product
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: { id: parseInt(id), ...updates }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete product
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;