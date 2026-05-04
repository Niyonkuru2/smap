class NotificationModel {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.title = data.title;
        this.message = data.message;
        this.type = data.type || 'info';
        this.is_read = data.is_read || false;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            title: this.title,
            message: this.message,
            type: this.type,
            is_read: this.is_read,
            created_at: this.created_at
        };
    }
}

export default NotificationModel;