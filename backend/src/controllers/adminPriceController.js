import adminReferencePriceService from '../services/adminReferencePriceService.js';
import productService from '../services/productService.js';

class AdminPriceController {
    /**
     * Set reference price (Admin creates real price)
     */
    async setReferencePrice(req, res) {
        try {
            const { 
                product_name, 
                product_id,
                market_id, 
                price, 
                unit,
                category_id,
                category_name,
                effective_date,
                expiry_date,
                notes
            } = req.body;
            
            const admin_id = req.user.id; // Assuming authenticated admin

            // Validate required fields
            if (!product_name && !product_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Either product name or product ID is required'
                });
            }

            if (!market_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Market ID is required'
                });
            }

            if (!price || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid price is required'
                });
            }

            const result = await adminReferencePriceService.setReferencePrice({
                product_name,
                product_id,
                market_id,
                price,
                unit,
                category_id,
                category_name,
                effective_date: effective_date || new Date(),
                expiry_date: expiry_date || null,
                notes: notes || '',
                admin_id
            });

            res.status(201).json(result);

        } catch (error) {
            console.error('Error setting reference price:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to set reference price'
            });
        }
    }

    /**
     * Update reference price
     */
    async updateReferencePrice(req, res) {
        try {
            const { id } = req.params;
            const { price, effective_date, expiry_date, notes } = req.body;
            const admin_id = req.user.id;

            const result = await adminReferencePriceService.updateReferencePrice(id, {
                price,
                effective_date,
                expiry_date,
                notes,
                admin_id
            });

            res.json(result);

        } catch (error) {
            console.error('Error updating reference price:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update reference price'
            });
        }
    }

    /**
     * Get all reference prices
     */
    async getAllReferencePrices(req, res) {
        try {
            const { product_id, market_id, is_current, limit, offset } = req.query;

            const result = await adminReferencePriceService.getAllReferencePrices({
                product_id,
                market_id,
                is_current: is_current === 'true',
                limit: parseInt(limit) || 100,
                offset: parseInt(offset) || 0
            });

            res.json(result);

        } catch (error) {
            console.error('Error getting reference prices:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get reference prices'
            });
        }
    }

    /**
     * Get price comparison
     */
    async getPriceComparison(req, res) {
        try {
            const { productId, marketId } = req.params;

            const result = await adminReferencePriceService.getPriceComparison(productId, marketId);

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error getting price comparison:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get price comparison'
            });
        }
    }

    /**
     * Bulk import reference prices
     */
    async bulkImportReferencePrices(req, res) {
        try {
            const { prices } = req.body;
            const admin_id = req.user.id;

            if (!prices || !Array.isArray(prices) || prices.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Prices array is required'
                });
            }

            const result = await adminReferencePriceService.bulkImportReferencePrices(prices, admin_id);

            res.json(result);

        } catch (error) {
            console.error('Error bulk importing reference prices:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to bulk import reference prices'
            });
        }
    }

    /**
     * Delete reference price
     */
    async deleteReferencePrice(req, res) {
        try {
            const { id } = req.params;
            const admin_id = req.user.id;

            const result = await adminReferencePriceService.deleteReferencePrice(id, admin_id);

            res.json(result);

        } catch (error) {
            console.error('Error deleting reference price:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete reference price'
            });
        }
    }

    /**
     * Get product with reference price information
     */
    async getProductWithReferencePrice(req, res) {
        try {
            const { productId } = req.params;
            const { marketId } = req.query;

            const result = await productService.getProductWithReferencePrices(productId, marketId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error getting product with reference price:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product information'
            });
        }
    }
}

export default new AdminPriceController();