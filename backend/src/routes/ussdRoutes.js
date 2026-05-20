import express from 'express';
import * as ussdController from '../controllers/ussdController.js';

const router = express.Router();

// African Talking USSD callback endpoint
router.post('/callback', ussdController.handleUSSDCallback);

// Test endpoint for development
router.post('/test', ussdController.testUSSD);

export default router;