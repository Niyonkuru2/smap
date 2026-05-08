import express from 'express';
import VendorController from '../controllers/VendorController.js';

const router = express.Router();
router.post('/', VendorController.createVendor);
router.get('/', VendorController.getAllVendors);
router.get('/:id', VendorController.getVendorById);
router.put('/:id', VendorController.updateVendor);
router.delete('/:id', VendorController.deleteVendor);

export default router;