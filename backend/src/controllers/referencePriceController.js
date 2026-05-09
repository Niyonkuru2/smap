import referencePriceService from'../services/referencePriceService.js';

class ReferencePriceController {
    /**
     * Create product with reference price
     */
    async createProductWithReferencePrice(req, res) {
        try {
            const result = await referencePriceService.createProductWithReferencePrice(
                req.body,
                req.user.id
            );
            
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in createProductWithReferencePrice:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Set reference price for existing product
     */
    async setReferencePrice(req, res) {
        try {
            const result = await referencePriceService.setReferencePrice(
                req.body,
                req.user.id
            );
            
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in setReferencePrice:', error);
            
            if (error.message === 'Product not found' || error.message === 'Market not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get reference prices with filters
     */
    async getReferencePrices(req, res) {
        try {
            const result = await referencePriceService.getReferencePrices(req.query);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error in getReferencePrices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get single reference price by ID
     */
    async getReferencePriceById(req, res) {
        try {
            const { id } = req.params;
            const result = await referencePriceService.getReferencePriceById(id);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getReferencePriceById:', error);
            
            if (error.message === 'Reference price not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Update reference price
     */
    async updateReferencePrice(req, res) {
        try {
            const { id } = req.params;
            const result = await referencePriceService.updateReferencePrice(id, req.body);
            
            res.json(result);
        } catch (error) {
            console.error('Error in updateReferencePrice:', error);
            
            if (error.message === 'Reference price not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message === 'No fields to update') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Delete reference price
     */
    async deleteReferencePrice(req, res) {
        try {
            const { id } = req.params;
            const result = await referencePriceService.deleteReferencePrice(id);
            
            res.json(result);
        } catch (error) {
            console.error('Error in deleteReferencePrice:', error);
            
            if (error.message === 'Reference price not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Bulk set reference prices
     */
    async bulkSetReferencePrices(req, res) {
        try {
            const result = await referencePriceService.bulkSetReferencePrices(
                req.body.prices,
                req.user.id
            );
            
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in bulkSetReferencePrices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get products with their reference prices
     */
    async getProductsWithPrices(req, res) {
        try {
            const result = await referencePriceService.getProductsWithPrices(req.query);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error in getProductsWithPrices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get reference price statistics
     */
    async getReferencePriceStatistics(req, res) {
        try {
            const result = await referencePriceService.getReferencePriceStatistics();
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getReferencePriceStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

export default new ReferencePriceController();