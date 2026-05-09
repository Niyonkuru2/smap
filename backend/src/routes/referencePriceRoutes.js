import express  from'express';
const router = express.Router();
import referencePriceController  from '../controllers/referencePriceController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

router.use(authenticateToken, adminOnly);
router.post('/products-with-price', referencePriceController.createProductWithReferencePrice);
router.post('/reference-prices', referencePriceController.setReferencePrice);
router.get('/reference-prices', referencePriceController.getReferencePrices);
router.get('/reference-prices/statistics/summary', referencePriceController.getReferencePriceStatistics);
router.post('/reference-prices/bulk', referencePriceController.bulkSetReferencePrices);
router.get('/products-with-prices', referencePriceController.getProductsWithPrices);
router.get('/reference-prices/:id', referencePriceController.getReferencePriceById);
router.put('/reference-prices/:id', referencePriceController.updateReferencePrice);
router.delete('/reference-prices/:id', referencePriceController.deleteReferencePrice);

export default router;