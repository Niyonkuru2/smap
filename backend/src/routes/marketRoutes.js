import express from 'express';
import * as marketController from '../controllers/marketController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', marketController.getMarkets);
router.get('/:id', marketController.getMarket);
router.get('/info/all', marketController.getMarketsInfo);
router.get('/prices/live', marketController.getLivePrices);
router.get('/prices/market/:marketName', marketController.getMarketPrices);
router.get('/compare/:productName', marketController.compareProductPrices);

export default router;