import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import EmailService from './EmailService.js';

class VendorService {
  static generatePassword() {
    return crypto.randomBytes(4).toString('hex');
  }

  static async createVendor(data) {
    const {
      name,
      email,
      phone,
      role = 'vendor',
      address,
      category,
    } = data;

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new Error('Vendor already exists');
    }

    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const result = await pool.query(
      `INSERT INTO users 
        (email, password_hash, name, role, phone, address, category, verified, registration_completed)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, true, true)
       RETURNING id, email, name, role, phone, address, category, verified, registration_completed, created_at`,
      [email, hashedPassword, name, role, phone, address, category]
    );

    const vendor = result.rows[0];

    await EmailService.sendVendorCredentialsEmail(
      email,
      name,
      email,
      plainPassword
    );

    return vendor;
  }
  static async getAllVendors() {
    const result = await pool.query(
      `SELECT id, email, name, role, phone, address, category, verified, is_active, created_at
       FROM users
       WHERE role = 'vendor'
       ORDER BY created_at DESC`
    );

    return result.rows;
  }

  static async getVendorById(id) {
    const result = await pool.query(
      `SELECT id, email, name, role, phone, address, category, verified, is_active, created_at
       FROM users
       WHERE id = $1 AND role = 'vendor'`,
      [id]
    );

    return result.rows[0];
  }
  static async updateVendor(id, data, currentUserRole) {
    const allowedFields = ['name', 'phone', 'address', 'category'];
    const adminOnlyFields = ['verified', 'is_active', 'role'];

    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      if (adminOnlyFields.includes(key) && currentUserRole !== 'admin') {
        throw new Error(`Not allowed to update ${key}`);
      }

      if ((allowedFields.includes(key) || adminOnlyFields.includes(key)) && value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${index}
       RETURNING id, email, name, role, phone, address, category, verified, is_active`,
      values
    );

    return result.rows[0];
  }

  static async deleteVendor(id) {
    const result = await pool.query(
      `UPDATE users 
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, is_active`,
      [id]
    );

    return result.rows[0];
  }
}

export default VendorService;