// src/routes/priceAlertRoutes.js
import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
    getUserPriceAlerts,
    getPriceAlertById,
    createPriceAlert,
    updatePriceAlert,
    deletePriceAlert,
    togglePriceAlert,
    getAlertStatistics,
    manualAlertCheck
} from '../controllers/priceAlertController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Main alert routes
router.get('/', getUserPriceAlerts);
router.get('/stats', getAlertStatistics);
router.post('/', createPriceAlert);

// Individual alert routes
router.get('/:id', getPriceAlertById);
router.put('/:id', updatePriceAlert);
router.delete('/:id', deletePriceAlert);
router.patch('/:id/toggle', togglePriceAlert);

// Admin only routes
router.post('/manual-check/:productId', authorize('admin'), manualAlertCheck);

export default router;