// src/routes/marketRoutes.js
import express from 'express';
import * as marketController from '../controllers/marketController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', marketController.getMarkets);
router.get('/info', marketController.getMarketsInfo);
router.get('/search', marketController.searchMarkets);
router.get('/province/:province', marketController.getMarketsByProvince);
router.get('/:id', marketController.getMarket);
router.get('/:id/prices', marketController.getMarketPrices);
router.get('/compare/:productName', marketController.compareProductPrices);
router.get('/prices/live', marketController.getLivePrices);
router.use(authenticateToken);
router.use(adminOnly);
router.post('/', marketController.createMarket);
router.put('/:id', marketController.updateMarket);
router.delete('/:id', marketController.deleteMarket);
router.post('/bulk', marketController.bulkCreateMarkets);
router.get('/stats', marketController.getMarketStats);

export default router;