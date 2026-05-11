import express from 'express';
import * as priceController from '../controllers/priceController.js';
import { authenticateToken, canSubmitPrice } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', priceController.getPrices);
router.get('/live', priceController.getLivePrices);
router.get('/history/:productId/:marketId', priceController.getPriceHistory);
router.get('/forecast/:productId/:marketId', priceController.getPriceForecast);
router.get('/compare/:productId', priceController.compareMarkets);
router.get('/best-time/:productId', priceController.getBestTimeToBuy);
router.get('/vendor-stats/:vendorId', priceController.getVendorStats);

// Protected routes
router.use(authenticateToken);
router.get('/my-submissions', priceController.getMySubmissions);
router.post('/submit', canSubmitPrice, validate(schemas.priceSubmit), priceController.submitPrice);
router.get('/recommendations', priceController.getRecommendations);

export default router;