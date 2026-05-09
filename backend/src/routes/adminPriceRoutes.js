// src/routes/adminPriceRoutes.js
import express from 'express';
import adminPriceController from '../controllers/adminPriceController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// Reference price management
router.post('/reference-prices', adminPriceController.setReferencePrice);
router.put('/reference-prices/:id', adminPriceController.updateReferencePrice);
router.delete('/reference-prices/:id', adminPriceController.deleteReferencePrice);
router.get('/reference-prices', adminPriceController.getAllReferencePrices);

// Price comparison
router.get('/comparison/:productId/:marketId', adminPriceController.getPriceComparison);

// Bulk operations
router.post('/reference-prices/bulk-import', adminPriceController.bulkImportReferencePrices);

// Product with reference prices
router.get('/products/:productId/reference', adminPriceController.getProductWithReferencePrice);

export default router;