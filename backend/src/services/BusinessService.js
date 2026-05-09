// src/services/BusinessService.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import EmailService from './EmailService.js';

class BusinessService {
  static generatePassword() {
    return crypto.randomBytes(4).toString('hex');
  }

  /**
   * Helper to get or create category by name
   */
  static async getOrCreateCategory(categoryName, categoryType = 'business') {
    if (!categoryName) return null;

    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND type = $2',
      [categoryName, categoryType]
    );

    if (existingCategory.rows.length > 0) {
      return existingCategory.rows[0].id;
    }

    const newCategory = await pool.query(
      `INSERT INTO categories (name, type, is_active) 
       VALUES ($1, $2, true) 
       RETURNING id`,
      [categoryName, categoryType]
    );

    return newCategory.rows[0].id;
  }

  /**
   * Create a new business user
   */
  static async createBusiness(data) {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      businessType,
      registrationNumber,
      taxId,
      tier = 'basic',
      status = 'pending',
      category
    } = data;

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Check if registration number is unique
    if (registrationNumber) {
      const existingReg = await pool.query(
        'SELECT id FROM business_users WHERE registration_number = $1',
        [registrationNumber]
      );
      if (existingReg.rows.length > 0) {
        throw new Error('Registration number already exists');
      }
    }

    // Get or create category
    const categoryId = await this.getOrCreateCategory(category || businessType, 'business');

    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create user record
    const userResult = await pool.query(
      `INSERT INTO users 
        (email, password_hash, name, role, phone, address, category_id, verified, registration_completed, is_active)
       VALUES 
        ($1, $2, $3, 'business', $4, $5, $6, true, true, $7)
       RETURNING id, email, name, role, phone, address, category_id, verified, is_active, created_at`,
      [email.toLowerCase(), hashedPassword, ownerName, phone || null, address || null, categoryId, status === 'active']
    );

    const user = userResult.rows[0];

    // Create business record
    const businessResult = await pool.query(
      `INSERT INTO business_users 
        (user_id, business_name, owner_name, business_type, category_id, registration_number, tax_id, tier, status, total_purchases, total_spent, rating)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0)
       RETURNING *`,
      [user.id, businessName, ownerName, businessType, categoryId, registrationNumber || null, taxId || null, tier, status]
    );

    const business = businessResult.rows[0];

    // Send credentials email
    await EmailService.sendBusinessCredentialsEmail(
      email,
      businessName,
      ownerName,
      email,
      plainPassword
    );

    // Return combined data
    return {
      id: user.id,
      email: user.email,
      ownerName: user.name,
      phone: user.phone,
      address: user.address,
      businessName: business.business_name,
      businessType: business.business_type,
      registrationNumber: business.registration_number,
      taxId: business.tax_id,
      tier: business.tier,
      status: business.status,
      createdAt: user.created_at,
      category_id: user.category_id
    };
  }

  /**
   * Get all business users
   */
  static async getAllBusinesses() {
    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.name as owner_name, u.phone, u.address, u.is_active, u.created_at,
        b.id as business_id, b.business_name, b.business_type, b.registration_number, 
        b.tax_id, b.tier, b.status, b.total_purchases, b.total_spent, b.rating,
        c.name as category_name
       FROM users u
       INNER JOIN business_users b ON u.id = b.user_id
       LEFT JOIN categories c ON u.category_id = c.id
       WHERE u.role = 'business'
       ORDER BY u.created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      businessType: row.business_type,
      category: row.category_name || '',
      registrationNumber: row.registration_number,
      taxId: row.tax_id,
      tier: row.tier,
      status: row.status,
      totalPurchases: parseInt(row.total_purchases) || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      rating: parseFloat(row.rating) || 0,
      joinDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      is_active: row.is_active
    }));
  }

  /**
   * Get business by ID
   */
  static async getBusinessById(id) {
    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.name as owner_name, u.phone, u.address, u.is_active, u.created_at, u.updated_at,
        b.id as business_id, b.business_name, b.business_type, b.registration_number, 
        b.tax_id, b.tier, b.status, b.total_purchases, b.total_spent, b.rating,
        c.name as category_name
       FROM users u
       INNER JOIN business_users b ON u.id = b.user_id
       LEFT JOIN categories c ON u.category_id = c.id
       WHERE u.id = $1 AND u.role = 'business'`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      businessId: row.business_id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      businessType: row.business_type,
      category: row.category_name || '',
      registrationNumber: row.registration_number,
      taxId: row.tax_id,
      tier: row.tier,
      status: row.status,
      totalPurchases: parseInt(row.total_purchases) || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      rating: parseFloat(row.rating) || 0,
      joinDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      is_active: row.is_active
    };
  }

  /**
   * Update business user
   */
  static async updateBusiness(id, data, currentUserRole) {
    const allowedFields = ['phone', 'address'];
    const adminOnlyFields = ['businessName', 'ownerName', 'businessType', 'tier', 'status', 'category', 'registrationNumber', 'taxId'];

    const userUpdates = [];
    const businessUpdates = [];
    const values = [];
    let index = 1;

    // Update user table fields
    if (data.phone !== undefined) {
      userUpdates.push(`phone = $${index++}`);
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      userUpdates.push(`address = $${index++}`);
      values.push(data.address);
    }
    if (data.is_active !== undefined && currentUserRole === 'admin') {
      userUpdates.push(`is_active = $${index++}`);
      values.push(data.is_active);
    }

    // Handle category (admin only)
    if (data.category !== undefined && currentUserRole === 'admin') {
      const categoryId = await this.getOrCreateCategory(data.category, 'business');
      userUpdates.push(`category_id = $${index++}`);
      values.push(categoryId);
    }

    // Update business table fields (admin only)
    if (currentUserRole === 'admin') {
      if (data.businessName !== undefined) {
        businessUpdates.push(`business_name = $${index++}`);
        values.push(data.businessName);
      }
      if (data.ownerName !== undefined) {
        businessUpdates.push(`owner_name = $${index++}`);
        values.push(data.ownerName);
      }
      if (data.businessType !== undefined) {
        businessUpdates.push(`business_type = $${index++}`);
        values.push(data.businessType);
      }
      if (data.tier !== undefined) {
        businessUpdates.push(`tier = $${index++}`);
        values.push(data.tier);
      }
      if (data.status !== undefined) {
        businessUpdates.push(`status = $${index++}`);
        values.push(data.status);
        // Also update user is_active based on status
        if (data.status === 'active') {
          userUpdates.push(`is_active = $${index++}`);
          values.push(true);
        } else if (data.status === 'inactive' || data.status === 'suspended') {
          userUpdates.push(`is_active = $${index++}`);
          values.push(false);
        }
      }
      if (data.registrationNumber !== undefined) {
        businessUpdates.push(`registration_number = $${index++}`);
        values.push(data.registrationNumber);
      }
      if (data.taxId !== undefined) {
        businessUpdates.push(`tax_id = $${index++}`);
        values.push(data.taxId);
      }
    }

    if (userUpdates.length === 0 && businessUpdates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    // Update users table
    if (userUpdates.length > 0) {
      userUpdates.push(`updated_at = NOW()`);
      await pool.query(
        `UPDATE users 
         SET ${userUpdates.join(', ')}
         WHERE id = $${index} AND role = 'business'`,
        values
      );
    }

    // Update business_users table
    if (businessUpdates.length > 0) {
      businessUpdates.push(`updated_at = NOW()`);
      await pool.query(
        `UPDATE business_users 
         SET ${businessUpdates.join(', ')}
         WHERE user_id = $${index}`,
        values
      );
    }

    // Return updated business
    return this.getBusinessById(id);
  }

  /**
   * Delete business user (soft delete)
   */
  static async deleteBusiness(id) {
    const result = await pool.query(
      `UPDATE users 
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND role = 'business'
       RETURNING id, email, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Business user not found');
    }

    return result.rows[0];
  }

  /**
   * Get business statistics
   */
  static async getBusinessStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_businesses,
        COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN b.status = 'inactive' THEN 1 END) as inactive_count,
        COUNT(CASE WHEN b.status = 'suspended' THEN 1 END) as suspended_count,
        COUNT(CASE WHEN b.tier = 'premium' THEN 1 END) as premium_count,
        COUNT(CASE WHEN b.tier = 'enterprise' THEN 1 END) as enterprise_count,
        COALESCE(SUM(b.total_spent), 0) as total_revenue
      FROM business_users b
      JOIN users u ON b.user_id = u.id
      WHERE u.role = 'business'
    `);
    
    return result.rows[0];
  }

  /**
   * Get business markets
   */
  static async getBusinessMarkets(businessId) {
    const result = await pool.query(
      `SELECT m.id, m.name, m.province, m.district
       FROM business_markets bm
       JOIN markets m ON bm.market_id = m.id
       WHERE bm.business_id = $1`,
      [businessId]
    );
    return result.rows;
  }

  /**
   * Add market to business
   */
  static async addBusinessMarket(businessId, marketId) {
    const result = await pool.query(
      `INSERT INTO business_markets (business_id, market_id)
       VALUES ($1, $2)
       ON CONFLICT (business_id, market_id) DO NOTHING
       RETURNING *`,
      [businessId, marketId]
    );
    return result.rows[0];
  }

  /**
   * Remove market from business
   */
  static async removeBusinessMarket(businessId, marketId) {
    const result = await pool.query(
      `DELETE FROM business_markets 
       WHERE business_id = $1 AND market_id = $2
       RETURNING *`,
      [businessId, marketId]
    );
    return result.rows[0];
  }
}

export default BusinessService;