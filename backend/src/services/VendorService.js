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

    // Check if vendor already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new Error('Vendor already exists');
    }

    // Generate credentials
    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert vendor (NOW including address + category)
    const result = await pool.query(
      `INSERT INTO users 
        (email, password_hash, name, role, phone, address, category, verified, registration_completed)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, true, true)
       RETURNING id, email, name, role, phone, address, category, verified, registration_completed, created_at`,
      [
        email,
        hashedPassword,
        name,
        role,
        phone,
        address,
        category,
      ]
    );

    const vendor = result.rows[0];

    // Send credentials email
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