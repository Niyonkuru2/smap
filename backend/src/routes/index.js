import express from 'express';
import authRoutes from './authRoutes.js';
import vendorRoutes from './vendorRoute.js';
import categoryRoutes from './categoryRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import businessRoutes from './businessRoutes.js';
import priceRoutes from './priceRoutes.js';
import marketRoutes from './marketRoutes.js';
import productRoutes from './productRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import alertRoutes from './alertRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import searchRoutes from './searchRoutes.js';
import exportRoutes from './exportRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import communityRoutes from './communityRoutes.js';
import ratingRoutes from './ratingRoutes.js';
import historyRoutes from './historyRoutes.js';
import predictionRoutes from './predictionRoutes.js';
import referencePriceRoutes from './referencePriceRoutes.js';
import vendorReferenceRoutes from './vendorRefernceRoute.js';
import smsRoutes from './smsRoutes.js';
import advertisementRoutes from './advertisementRoutes.js';

const router = express.Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/vendor', vendorRoutes);
router.use('/categories', categoryRoutes);
router.use('/businesses', businessRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/prices', priceRoutes);
router.use('/markets', marketRoutes);
router.use('/products', productRoutes);
router.use('/advertisements', advertisementRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reference-prices', referencePriceRoutes);
router.use('/vendor-prices', vendorReferenceRoutes);
router.use('/search', searchRoutes);
router.use('/export', exportRoutes);
router.use('/verify', verificationRoutes);
router.use('/community', communityRoutes);
router.use('/ratings', ratingRoutes);
router.use('/history', historyRoutes);
router.use('/predict', predictionRoutes);
router.use('/sms', smsRoutes);

// Also handle legacy paths
router.use('/import', exportRoutes);
router.use('/ussd', smsRoutes);
router.use('/forecast', predictionRoutes);
router.use('/trends', historyRoutes);
router.use('/seasonal', historyRoutes);
router.use('/compare', priceRoutes);
router.use('/searches', searchRoutes);
router.use('/profile', authRoutes);

export default router;