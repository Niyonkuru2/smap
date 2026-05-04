
class UserModel {
    constructor(data = {}) {
        this.id = data.id;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.name = data.name;
        this.role = data.role || 'consumer';
        this.phone = data.phone;
        this.market_id = data.market_id;
        this.province = data.province;
        this.district = data.district;
        this.verified = data.verified || false;
        this.avatar_url = data.avatar_url;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            role: this.role,
            phone: this.phone,
            market_id: this.market_id,
            province: this.province,
            district: this.district,
            verified: this.verified,
            avatar_url: this.avatar_url,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

export default UserModel;