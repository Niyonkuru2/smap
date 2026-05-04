class ProductModel {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.category = data.category;
        this.unit = data.unit;
        this.description = data.description;
        this.image_url = data.image_url;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            unit: this.unit,
            description: this.description,
            image_url: this.image_url,
            created_at: this.created_at
        };
    }
}

export default ProductModel;