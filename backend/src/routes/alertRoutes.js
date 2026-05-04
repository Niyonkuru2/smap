import express from 'express';
import * as alertController from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', alertController.getAlerts);
router.post('/create', validate(schemas.alertCreate), alertController.createAlert);
router.delete('/:id', alertController.deleteAlert);

export default router;