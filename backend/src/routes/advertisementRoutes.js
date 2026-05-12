// src/routes/advertisementRoutes.js
import express from 'express';
import * as adController from '../controllers/AdvertisementService.js';
import { authenticateToken, adminOnly, vendorOnly } from '../middleware/auth.js';

const router = express.Router();

// =============================
// PUBLIC ROUTES (No auth required)
// =============================
router.get('/active', adController.getActiveAdvertisements);
router.post('/:id/view', adController.trackAdView);
router.get('/:id/click', adController.trackAdClick);

// =============================
// VENDOR ROUTES (Authentication + Vendor role)
// =============================
router.use(authenticateToken);
router.use(vendorOnly);

router.post('/submit', adController.submitAdvertisement);
router.get('/my-ads', adController.getMyAdvertisements);
router.get('/my-stats', adController.getMyAdStats);
router.get('/my-ads/:id', adController.getAdvertisementById);
router.put('/my-ads/:id', adController.updateAdvertisement);
router.delete('/my-ads/:id', adController.deleteAdvertisement);

// =============================
// ADMIN ROUTES (Authentication + Admin role)
// =============================
router.use(adminOnly);

router.get('/pending', adController.getPendingAdvertisements);
router.get('/all', adController.getAllAdvertisements);
router.put('/:id/approve', adController.approveAdvertisement);
router.put('/:id/reject', adController.rejectAdvertisement);
router.get('/analytics', adController.getAdAnalytics);
router.post('/expire', adController.expireAdvertisements);

export default router;