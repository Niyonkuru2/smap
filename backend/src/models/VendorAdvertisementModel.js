class VendorAdvertisementModel {
    constructor(data = {}) {
        this.id = data.id;
        this.vendor_id = data.vendor_id;
        this.title = data.title;
        this.description = data.description;
        this.image_url = data.image_url;
        this.target_url = data.target_url;
        this.advertisement_type = data.advertisement_type || 'banner';
        this.placement = data.placement;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.budget = data.budget;
        this.status = data.status || 'pending';
        this.approved_by = data.approved_by;
        this.approved_at = data.approved_at;
        this.rejection_reason = data.rejection_reason;
        this.clicks_count = data.clicks_count || 0;
        this.views_count = data.views_count || 0;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    isActive() {
        const now = new Date();
        return this.status === 'active' && 
               new Date(this.start_date) <= now && 
               new Date(this.end_date) >= now;
    }
}

export default VendorAdvertisementModel;