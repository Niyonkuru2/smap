// src/routes/analyticsRoutes.js
import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
    getAnalyticsDashboard,
    getPopularProducts,
    getActiveMarkets,
    getWeeklyActivity,
    getCategoryDistribution,
    getPriceAlerts,
    getMonthlyTrend,
    getTopVendors,
    getPriceRangeDistribution,
    getSummaryStats,
    getAnomalyStatsForDashboard
} from '../controllers/analyticsController.js';

const router = express.Router();
router.get('/dashboard', getAnalyticsDashboard);
router.get('/popular-products', getPopularProducts);
router.get('/active-markets', getActiveMarkets);
router.get('/weekly-activity', getWeeklyActivity);
router.get('/category-distribution', getCategoryDistribution);
router.get('/price-alerts', getPriceAlerts);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/price-range-distribution', getPriceRangeDistribution);
router.get('/summary-stats', getSummaryStats);
router.get('/top-vendors', authenticateToken, authorize('admin'), getTopVendors);
router.get('/anomaly-stats', authenticateToken, authorize('admin'), getAnomalyStatsForDashboard);

export default router;