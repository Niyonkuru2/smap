// src/controllers/subscriptionController.js
import SubscriptionService from '../services/SubscriptionService.js';

// =============================
// PLAN MANAGEMENT (Admin)
// =============================

export const getAllPlans = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const plans = await SubscriptionService.getAllPlans(includeInactive);
        
        res.json({
            success: true,
            message: 'Plans fetched successfully',
            data: plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch plans'
        });
    }
};

export const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await SubscriptionService.getPlanById(id);
        
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Plan fetched successfully',
            data: plan
        });
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch plan'
        });
    }
};

export const createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionService.createPlan(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: plan
        });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create plan'
        });
    }
};

export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await SubscriptionService.updatePlan(id, req.body);
        
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Plan updated successfully',
            data: plan
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update plan'
        });
    }
};

export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await SubscriptionService.deletePlan(id);
        
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Plan deactivated successfully',
            data: plan
        });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete plan'
        });
    }
};

// =============================
// USER SUBSCRIPTION MANAGEMENT
// =============================

export const subscribeToPlan = async (req, res) => {
    try {
        const { planId, paymentMethod, paymentReference } = req.body;
        const userId = req.user.id;
        
        const result = await SubscriptionService.subscribeUser(
            userId, 
            planId, 
            paymentMethod || 'bank_transfer',
            paymentReference || null
        );
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to subscribe'
        });
    }
};

export const getMyActiveSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await SubscriptionService.getActiveSubscription(userId);
        
        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Get active subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subscription'
        });
    }
};

export const getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const subscriptions = await SubscriptionService.getUserSubscriptions(userId, limit);
        
        res.json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subscriptions'
        });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await SubscriptionService.cancelSubscription(userId, id);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel subscription'
        });
    }
};

// =============================
// ADMIN SUBSCRIPTION MANAGEMENT
// =============================

export const getPendingSubscriptions = async (req, res) => {
    try {
        const subscriptions = await SubscriptionService.getPendingSubscriptions();
        
        res.json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        console.error('Get pending subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch pending subscriptions'
        });
    }
};

export const approveSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        
        const result = await SubscriptionService.approveSubscription(id, adminId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Approve subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve subscription'
        });
    }
};

export const rejectSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const { reason } = req.body;
        
        const result = await SubscriptionService.rejectSubscription(id, adminId, reason);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Reject subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject subscription'
        });
    }
};

export const getSubscriptionStats = async (req, res) => {
    try {
        const stats = await SubscriptionService.getSubscriptionStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get subscription stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch stats'
        });
    }
};

// =============================
// CRON JOBS (Admin endpoints)
// =============================

export const checkExpiringSubscriptions = async (req, res) => {
    try {
        const result = await SubscriptionService.checkExpiringSubscriptions();
        
        res.json(result);
    } catch (error) {
        console.error('Check expiring subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to check expiring subscriptions'
        });
    }
};

export const expireSubscriptions = async (req, res) => {
    try {
        const result = await SubscriptionService.expireSubscriptions();
        
        res.json(result);
    } catch (error) {
        console.error('Expire subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to expire subscriptions'
        });
    }
};