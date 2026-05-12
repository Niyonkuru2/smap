import AdvertisementService from '../services/AdvertisementService.js';
export const submitAdvertisement = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const result = await AdvertisementService.submitAdvertisement(vendorId, req.body);
        
        if (!result.success) {
            return res.status(result.requiresSubscription ? 403 : 400).json(result);
        }
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Submit advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit advertisement'
        });
    }
};

export const getMyAdvertisements = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { status } = req.query;
        const advertisements = await AdvertisementService.getVendorAdvertisements(vendorId, status);
        
        res.json({
            success: true,
            data: advertisements
        });
    } catch (error) {
        console.error('Get advertisements error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch advertisements'
        });
    }
};

export const getMyAdStats = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const stats = await AdvertisementService.getVendorAdStats(vendorId);
        const performance = await AdvertisementService.getVendorAdPerformance(vendorId);
        
        res.json({
            success: true,
            data: { stats, performance }
        });
    } catch (error) {
        console.error('Get ad stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch ad statistics'
        });
    }
};

export const getAdvertisementById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;
        const advertisement = await AdvertisementService.getAdvertisementById(id, vendorId);
        
        if (!advertisement) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found'
            });
        }
        
        res.json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        console.error('Get advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch advertisement'
        });
    }
};

export const updateAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;
        const result = await AdvertisementService.updateAdvertisement(id, vendorId, req.body);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Update advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update advertisement'
        });
    }
};

export const deleteAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;
        const result = await AdvertisementService.deleteAdvertisement(id, vendorId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Delete advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete advertisement'
        });
    }
};

// =============================
// PUBLIC ENDPOINTS (for displaying ads)
// =============================

export const getActiveAdvertisements = async (req, res) => {
    try {
        const { placement, limit = 10 } = req.query;
        let query = `
            SELECT id, title, description, image_url, target_url, 
                   advertisement_type, placement, vendor_id
            FROM vendor_advertisements
            WHERE status = 'active'
              AND (start_date IS NULL OR start_date <= NOW())
              AND (end_date IS NULL OR end_date >= NOW())
        `;
        const params = [];
        let paramIndex = 1;
        
        if (placement) {
            query += ` AND placement = $${paramIndex}`;
            params.push(placement);
            paramIndex++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit));
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get active ads error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch advertisements'
        });
    }
};

export const trackAdView = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await AdvertisementService.trackAdEvent(id, 'view', userId, ipAddress, userAgent);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track ad view error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track view'
        });
    }
};

export const trackAdClick = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await AdvertisementService.trackAdEvent(id, 'click', userId, ipAddress, userAgent);
        
        // Get the target URL to redirect
        const result = await pool.query(
            `SELECT target_url FROM vendor_advertisements WHERE id = $1`,
            [id]
        );
        
        res.json({ 
            success: true, 
            redirect_url: result.rows[0]?.target_url || null 
        });
    } catch (error) {
        console.error('Track ad click error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track click'
        });
    }
};

// =============================
// ADMIN ENDPOINTS
// =============================

export const getPendingAdvertisements = async (req, res) => {
    try {
        const advertisements = await AdvertisementService.getPendingAdvertisements();
        
        res.json({
            success: true,
            data: advertisements
        });
    } catch (error) {
        console.error('Get pending ads error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch pending advertisements'
        });
    }
};

export const getAllAdvertisements = async (req, res) => {
    try {
        const { status, vendor_id } = req.query;
        const advertisements = await AdvertisementService.getAllAdvertisements({ status, vendor_id });
        
        res.json({
            success: true,
            data: advertisements
        });
    } catch (error) {
        console.error('Get all ads error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch advertisements'
        });
    }
};

export const approveAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const result = await AdvertisementService.approveAdvertisement(id, adminId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Approve advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve advertisement'
        });
    }
};

export const rejectAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const { reason } = req.body;
        
        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }
        
        const result = await AdvertisementService.rejectAdvertisement(id, adminId, reason);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Reject advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject advertisement'
        });
    }
};

export const getAdAnalytics = async (req, res) => {
    try {
        const analytics = await AdvertisementService.getAdminAdAnalytics();
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get ad analytics error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch analytics'
        });
    }
};

export const expireAdvertisements = async (req, res) => {
    try {
        const result = await AdvertisementService.expireAdvertisements();
        
        res.json(result);
    } catch (error) {
        console.error('Expire advertisements error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to expire advertisements'
        });
    }
};