import { catchAsync } from '../middleware/errorHandler.js';
import PriceAlertRepository from '../repositories/PriceAlertRepository.js';
import { sendPriceTargetAlert } from '../services/notifications.js';

export const getAlerts = catchAsync(async (req, res) => {
    const alerts = await PriceAlertRepository.getByUser(req.user.id);
    res.json({ success: true, alerts });
});

export const createAlert = catchAsync(async (req, res) => {
    const { productId, marketId, targetPrice, alertType } = req.body;
    
    const alert = await PriceAlertRepository.create({
        user_id: req.user.id,
        product_id: productId,
        market_id: marketId,
        target_price: targetPrice,
        alert_type: alertType
    });
    
    res.json({ success: true, alert });
});

export const deleteAlert = catchAsync(async (req, res) => {
    await PriceAlertRepository.delete(req.params.id, req.user.id);
    res.json({ success: true, message: 'Alert deleted' });
});