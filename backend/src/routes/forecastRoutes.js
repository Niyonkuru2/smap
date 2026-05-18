// src/routes/forecastRoutes.js
import express from 'express';
import * as forecastController from '../controllers/forecastController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/product/:productId/market/:marketId', forecastController.getPriceForecast);
router.get('/product/:productId/best-time', forecastController.getBestTimeToBuy);
router.get('/product/:productId/markets', forecastController.getMarketComparison);
router.get('/product/:productId/summary', forecastController.getProductForecastSummary);

router.use(authenticateToken);
router.use(adminOnly);
router.post('/train', forecastController.trainModels);
router.get('/metrics', forecastController.getModelMetrics);

export default router;