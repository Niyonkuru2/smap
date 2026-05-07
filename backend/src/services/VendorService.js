import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import EmailService from './EmailService.js';

class VendorService {
  static generatePassword() {
    return crypto.randomBytes(4).toString('hex'); // 8 chars
  }

  static async createVendor(data) {
    const { name, email, phone,role = 'vendor', address, category } = data;

    // Check if exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new Error('Vendor already exists');
    }

    // Generate password
    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Save user
    const result = await pool.query(
      `INSERT INTO users 
      (email, password_hash, name, role, phone, verified, registration_completed) 
      VALUES ($1,$2,$3,'vendor',$4,true,true) 
      RETURNING *`,
      [email, hashedPassword, name, phone]
    );

    const vendor = result.rows[0];

    // Send email
    await EmailService.sendVendorCredentialsEmail({
      to: email,
      name,
      emailAddress: email,
      password: plainPassword,
    });

    return vendor;
  }
}

export default VendorService;