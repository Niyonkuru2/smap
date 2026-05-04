import pool from '../config/database.js';

class UserRepository {
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        return result.rows[0];
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async create(userData) {
        const { email, password_hash, name, role = 'consumer', phone = null, market_id = null, province = null, district = null } = userData;
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role, phone, market_id, province, district, verified, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             RETURNING *`,
            [email.toLowerCase(), password_hash, name, role, phone, market_id, province, district, false]
        );
        return result.rows[0];
    }

    async createWithVerification(userData) {
        const { email, password_hash, name, role = 'consumer', verified = false } = userData;
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role, verified, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING *`,
            [email.toLowerCase(), password_hash, name, role, verified]
        );
        
        return result.rows[0];
    }

    async storeVerificationCode(email, code, expiresAt) {
        const result = await pool.query(
            `INSERT INTO verification_codes (email, code, expires_at, used, created_at)
             VALUES ($1, $2, $3, false, NOW())
             RETURNING *`,
            [email.toLowerCase(), code, expiresAt]
        );
        return result.rows[0];
    }

    async verifyCode(email, code) {
        const result = await pool.query(
            `SELECT * FROM verification_codes 
             WHERE email = $1 
               AND code = $2 
               AND used = false 
               AND expires_at > NOW()
             ORDER BY created_at DESC 
             LIMIT 1`,
            [email.toLowerCase(), code]
        );
        
        if (result.rows.length > 0) {
            await pool.query(
                'UPDATE verification_codes SET used = true WHERE id = $1',
                [result.rows[0].id]
            );
            return result.rows[0];
        }
        return null;
    }

    async update(id, updates) {
    const allowedFields = [
        'name', 'phone', 'market_id', 'province', 'district', 
        'verified', 'last_login', 'password_hash', 'is_active', 'avatar_url',
        'registration_completed'  // Add this line
    ];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    
    console.log('Update query:', query);
    console.log('Update values:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0];
}

    async verifyUser(email) {
        const result = await pool.query(
            `UPDATE users 
             SET verified = true, updated_at = NOW()
             WHERE email = $1 
             RETURNING *`,
            [email.toLowerCase()]
        );
        return result.rows[0];
    }

    async updateLastLogin(id) {
        const result = await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    async storeResetToken(email, token, code, expiresAt) {
        const result = await pool.query(
            `UPDATE users 
             SET reset_token = $1, reset_code = $2, reset_expires = $3, updated_at = NOW()
             WHERE email = $4 
             RETURNING *`,
            [token, code, expiresAt, email.toLowerCase()]
        );
        return result.rows[0];
    }

    async findByResetToken(token) {
        const result = await pool.query(
            `SELECT * FROM users 
             WHERE reset_token = $1 
               AND reset_expires > NOW()`,
            [token]
        );
        return result.rows[0];
    }

    async clearResetToken(email) {
        const result = await pool.query(
            `UPDATE users 
             SET reset_token = NULL, reset_code = NULL, reset_expires = NULL, updated_at = NOW()
             WHERE email = $1 
             RETURNING *`,
            [email.toLowerCase()]
        );
        return result.rows[0];
    }

    async getAllUsers(limit = 100, offset = 0) {
        const result = await pool.query(
            `SELECT id, email, name, role, phone, market_id, province, district, 
                    verified, is_active, last_login, created_at, updated_at
             FROM users 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    async updateUserRole(userId, role) {
        const result = await pool.query(
            `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [role, userId]
        );
        return result.rows[0];
    }

    async deleteUser(userId) {
        const result = await pool.query(
            `DELETE FROM users WHERE id = $1 RETURNING id`,
            [userId]
        );
        return result.rows[0];
    }
}

export default new UserRepository();