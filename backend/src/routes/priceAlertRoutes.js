import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    getUserPriceAlerts,
    createPriceAlert,
    updatePriceAlert,
    deletePriceAlert,
    togglePriceAlert
} from '../controllers/priceAlertController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserPriceAlerts);
router.post('/', createPriceAlert);
router.put('/:id', updatePriceAlert);
router.delete('/:id', deletePriceAlert);
router.patch('/:id/toggle', togglePriceAlert);

export default router;