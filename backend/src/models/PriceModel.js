class PriceModel {
    constructor(data = {}) {
        this.id = data.id;
        this.product_id = data.product_id;
        this.market_id = data.market_id;
        this.vendor_id = data.vendor_id;
        this.price = data.price;
        this.unit = data.unit;
        this.status = data.status || 'pending';
        this.notes = data.notes;
        this.flagged = data.flagged || false;
        this.flag_reason = data.flag_reason;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Joined fields
        this.product_name = data.product_name;
        this.product_category = data.product_category;
        this.product_unit = data.product_unit;
        this.market_name = data.market_name;
        this.market_province = data.market_province;
        this.market_district = data.market_district;
        this.vendor_name = data.vendor_name;
        this.vendor_email = data.vendor_email;
    }

    toJSON() {
        return {
            id: this.id,
            product_id: this.product_id,
            market_id: this.market_id,
            vendor_id: this.vendor_id,
            price: this.price,
            unit: this.unit,
            status: this.status,
            notes: this.notes,
            flagged: this.flagged,
            flag_reason: this.flag_reason,
            created_at: this.created_at,
            updated_at: this.updated_at,
            product_name: this.product_name,
            product_category: this.product_category,
            product_unit: this.product_unit,
            market_name: this.market_name,
            market_province: this.market_province,
            market_district: this.market_district,
            vendor_name: this.vendor_name,
            vendor_email: this.vendor_email
        };
    }
}

export default PriceModel;