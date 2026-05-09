// src/routes/businessRoutes.js
import express from 'express';
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessStats,
  getBusinessMarkets,
  addBusinessMarket,
  removeBusinessMarket
} from '../controllers/businessController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.post('/', authenticate, adminOnly, createBusiness);
router.get('/', authenticate, adminOnly, getAllBusinesses);
router.get('/stats', authenticate, adminOnly, getBusinessStats);
router.get('/:id', authenticate, adminOnly, getBusinessById);
router.put('/:id', authenticate, adminOnly, updateBusiness);
router.delete('/:id', authenticate, adminOnly, deleteBusiness);

// Business markets routes
router.get('/:id/markets', authenticate, adminOnly, getBusinessMarkets);
router.post('/:id/markets/:marketId', authenticate, adminOnly, addBusinessMarket);
router.delete('/:id/markets/:marketId', authenticate, adminOnly, removeBusinessMarket);

export default router;