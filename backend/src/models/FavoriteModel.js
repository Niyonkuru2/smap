class FavoriteModel {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.product_id = data.product_id;
        this.market_id = data.market_id;
        this.created_at = data.created_at;
        this.product_name = data.product_name;
        this.market_name = data.market_name;
    }

    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            product_id: this.product_id,
            market_id: this.market_id,
            created_at: this.created_at,
            product_name: this.product_name,
            market_name: this.market_name
        };
    }
}

export default FavoriteModel;