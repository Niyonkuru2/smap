import express from 'express';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import {
    getAnomalies,
    getAnomalyById,
    updateAnomalyStatus,
    assignAnomaly,
    getAnomalyStats,
    getVendorAnomalySummary
} from '../controllers/anomalyController.js';

const router = express.Router();
router.use(authenticateToken);
router.use(adminOnly);

router.get('/', getAnomalies);
router.get('/stats', getAnomalyStats);
router.get('/:id', getAnomalyById);
router.patch('/:id/status', updateAnomalyStatus);
router.patch('/:id/assign', assignAnomaly);
router.get('/vendor/:vendorId/summary', getVendorAnomalySummary);

export default router;