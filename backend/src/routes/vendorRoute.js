import express from 'express';
import VendorController from '../controllers/VendorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/',VendorController.createVendor);
router.get('/', VendorController.getAllVendors); 
router.get('/:id', authenticate, VendorController.getVendorById);
router.put('/:id', authenticate, VendorController.updateVendor);
router.delete('/:id', authenticate, VendorController.deleteVendor);

export default router;