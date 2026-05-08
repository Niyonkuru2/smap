import express from 'express';
import VendorController from '../controllers/VendorController.js';

const router = express.Router();

// Create vendor
router.post('/vendors', VendorController.createVendor);

export default router;