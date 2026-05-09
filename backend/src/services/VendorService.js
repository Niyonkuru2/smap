import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import EmailService from './EmailService.js';

class VendorService {
  static generatePassword() {
    return crypto.randomBytes(4).toString('hex');
  }

  /**
   * Helper to get or create category by name
   */
  static async getOrCreateCategory(categoryName, categoryType = 'vendor') {
    if (!categoryName) return null;

    // Check if category exists by name
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND type = $2',
      [categoryName, categoryType]
    );

    if (existingCategory.rows.length > 0) {
      return existingCategory.rows[0].id;
    }

    // Create new category
    const newCategory = await pool.query(
      `INSERT INTO categories (name, type, is_active) 
       VALUES ($1, $2, true) 
       RETURNING id`,
      [categoryName, categoryType]
    );

    return newCategory.rows[0].id;
  }

  /**
   * Create a new vendor
   */
  static async createVendor(data) {
    const {
      name,
      email,
      phone,
      role = 'vendor',
      address,
      category, // This will be used to find/create category
    } = data;

    // Check if vendor already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      throw new Error('Vendor already exists');
    }

    // Get or create category
    const categoryId = await this.getOrCreateCategory(category, 'vendor');

    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const result = await pool.query(
      `INSERT INTO users 
        (email, password_hash, name, role, phone, address, category_id, verified, registration_completed, is_active)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, true, true, true)
       RETURNING id, email, name, role, phone, address, category_id, verified, registration_completed, is_active, created_at`,
      [email.toLowerCase(), hashedPassword, name, role, phone, address, categoryId]
    );

    const vendor = result.rows[0];

    // Create vendor metrics record
    await pool.query(
      `INSERT INTO vendor_metrics (vendor_id, total_price_submissions, approved_submissions, rejected_submissions, subscription_tier, rating)
       VALUES ($1, 0, 0, 0, 'basic', 0)`,
      [vendor.id]
    );

    // Send credentials email
    await EmailService.sendVendorCredentialsEmail(
      email,
      name,
      email,
      plainPassword
    );

    // Return vendor with category name
    const vendorWithCategory = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.address, u.category_id, 
              u.verified, u.is_active, u.registration_completed, u.created_at,
              c.name as category_name
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       WHERE u.id = $1`,
      [vendor.id]
    );

    return vendorWithCategory.rows[0];
  }

  /**
   * Get all vendors
   */
  static async getAllVendors() {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.address, u.category_id, 
              u.verified, u.is_active, u.created_at, u.updated_at,
              c.name as category_name,
              vm.total_price_submissions, vm.approved_submissions, vm.rejected_submissions,
              vm.subscription_tier, vm.rating
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       LEFT JOIN vendor_metrics vm ON u.id = vm.vendor_id
       WHERE u.role = 'vendor'
       ORDER BY u.created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      phone: row.phone || '',
      address: row.address || '',
      category: row.category_name || '',
      category_id: row.category_id,
      verified: row.verified,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.is_active 
        ? (row.verified ? 'active' : 'pending') 
        : 'inactive',
      rating: row.rating || 0,
      totalProducts: parseInt(row.total_price_submissions) || 0,
      approvedSubmissions: parseInt(row.approved_submissions) || 0,
      rejectedSubmissions: parseInt(row.rejected_submissions) || 0,
      subscriptionTier: row.subscription_tier || 'basic',
      joinDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    }));
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(id) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.address, u.category_id, 
              u.verified, u.is_active, u.created_at, u.updated_at,
              c.name as category_name,
              vm.total_price_submissions, vm.approved_submissions, vm.rejected_submissions,
              vm.subscription_tier, vm.rating
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       LEFT JOIN vendor_metrics vm ON u.id = vm.vendor_id
       WHERE u.id = $1 AND u.role = 'vendor'`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      phone: row.phone || '',
      address: row.address || '',
      category: row.category_name || '',
      category_id: row.category_id,
      verified: row.verified,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.is_active 
        ? (row.verified ? 'active' : 'pending') 
        : 'inactive',
      rating: row.rating || 0,
      totalProducts: parseInt(row.total_price_submissions) || 0,
      approvedSubmissions: parseInt(row.approved_submissions) || 0,
      rejectedSubmissions: parseInt(row.rejected_submissions) || 0,
      subscriptionTier: row.subscription_tier || 'basic',
      joinDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    };
  }

  /**
   * Update vendor
   */
  static async updateVendor(id, data, currentUserRole) {
    const allowedFields = ['name', 'phone', 'address'];
    const adminOnlyFields = ['verified', 'is_active', 'role', 'category'];

    const updates = [];
    const values = [];
    let index = 1;

    // Handle category specially (admin only)
    if (data.category !== undefined && currentUserRole === 'admin') {
      const categoryId = await this.getOrCreateCategory(data.category, 'vendor');
      updates.push(`category_id = $${index++}`);
      values.push(categoryId);
    }

    // Handle regular allowed fields
    for (const [key, value] of Object.entries(data)) {
      if (adminOnlyFields.includes(key) && currentUserRole !== 'admin') {
        throw new Error(`Not allowed to update ${key}`);
      }

      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${index++}`);
        values.push(value);
      }
    }

    // Handle admin-only fields
    if (currentUserRole === 'admin') {
      if (data.verified !== undefined) {
        updates.push(`verified = $${index++}`);
        values.push(data.verified);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${index++}`);
        values.push(data.is_active);
      }
      if (data.role !== undefined && data.role !== 'vendor') {
        throw new Error('Cannot change vendor role');
      }
    }

    // Handle status mapping for frontend
    if (data.status !== undefined && currentUserRole === 'admin') {
      if (data.status === 'active') {
        updates.push(`is_active = $${index++}, verified = $${index++}`);
        values.push(true, true);
      } else if (data.status === 'inactive') {
        updates.push(`is_active = $${index++}, verified = $${index++}`);
        values.push(false, false);
      } else if (data.status === 'pending') {
        updates.push(`is_active = $${index++}, verified = $${index++}`);
        values.push(true, false);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${index} AND role = 'vendor'
       RETURNING id, email, name, role, phone, address, category_id, verified, is_active`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Vendor not found');
    }

    // Return updated vendor with category name
    const updatedVendor = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.address, u.category_id, 
              u.verified, u.is_active, u.created_at, u.updated_at,
              c.name as category_name
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       WHERE u.id = $1`,
      [id]
    );

    const row = updatedVendor.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      phone: row.phone || '',
      address: row.address || '',
      category: row.category_name || '',
      verified: row.verified,
      is_active: row.is_active,
      status: row.is_active 
        ? (row.verified ? 'active' : 'pending') 
        : 'inactive'
    };
  }

  /**
   * Delete vendor (soft delete)
   */
  static async deleteVendor(id) {
    // Check if vendor exists
    const vendorCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'vendor']
    );

    if (vendorCheck.rows.length === 0) {
      throw new Error('Vendor not found');
    }

    const result = await pool.query(
      `UPDATE users 
       SET is_active = false, verified = false, updated_at = NOW()
       WHERE id = $1 AND role = 'vendor'
       RETURNING id, email, is_active`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Get vendor statistics
   */
  static async getVendorStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN is_active = true AND verified = true THEN 1 END) as active_vendors,
        COUNT(CASE WHEN is_active = true AND verified = false THEN 1 END) as pending_vendors,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_vendors,
        COALESCE(SUM(vm.total_price_submissions), 0) as total_submissions,
        COALESCE(SUM(vm.approved_submissions), 0) as total_approved
      FROM users u
      LEFT JOIN vendor_metrics vm ON u.id = vm.vendor_id
      WHERE u.role = 'vendor'
    `);
    
    return result.rows[0];
  }
}

export default VendorService;