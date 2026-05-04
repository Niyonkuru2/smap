import express from 'express';
import * as favoriteController from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', favoriteController.getFavorites);
router.post('/add', validate(schemas.favoriteAdd), favoriteController.addFavorite);
router.post('/remove', validate(schemas.favoriteAdd), favoriteController.removeFavorite);

export default router;