import DatabaseService from '../services/DatabaseService.js';
import NotificationModel from '../models/NotificationModel.js';

class NotificationRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getByUser(userId) {
        const result = await this.dbService.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [userId]
        );
        return result.rows.map(row => new NotificationModel(row));
    }

    async markAsRead(notificationId) {
        await this.dbService.query(
            `UPDATE notifications SET is_read = true WHERE id = $1`,
            [notificationId]
        );
        return { success: true };
    }
}

export default new NotificationRepository();