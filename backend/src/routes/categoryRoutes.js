// src/routes/categoryRoutes.js
import express from 'express';
import { 
    getAllCategories,
    getCategoryById,
    getProductsByCategory,
    getBusinessesByCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryTree
} from '../controllers/categoryController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategoryById);
router.get('/:id/products', getProductsByCategory);
router.get('/:id/businesses', getBusinessesByCategory);
router.post('/', authenticate, adminOnly, createCategory);
router.put('/:id', authenticate, adminOnly, updateCategory);
router.delete('/:id', authenticate, adminOnly, deleteCategory);

export default router;