class MarketModel {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.province = data.province;
        this.district = data.district;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            province: this.province,
            district: this.district,
            latitude: this.latitude,
            longitude: this.longitude,
            created_at: this.created_at
        };
    }
}

export default MarketModel;