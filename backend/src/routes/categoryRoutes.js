// src/routes/categoryRoutes.js
import express from 'express';
import { 
    getAllCategories, 
    getProductsByCategory, 
    createCategory 
} from '../controllers/categoryController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.get('/', getAllCategories);
router.get('/:category/products', getProductsByCategory);
router.post('/', authenticate, adminOnly, createCategory);

export default router;