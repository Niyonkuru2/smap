#!/usr/bin/env node
/**
 * Quick Verification Fix
 * Mark existing accounts as verified for testing
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://smpmps_db_user:12345@localhost:5432/smpmps_db'
});

async function verifyAllAccounts() {
  try {
    console.log('🔍 Checking database connection...');
    const connection = await pool.connect();
    console.log('✅ Connected to database');
    connection.release();

    console.log('\n📋 Fetching unverified accounts...');
    const result = await pool.query(
      'SELECT id, email, name, verified FROM users WHERE verified = false'
    );

    const unverifiedUsers = result.rows;

    if (unverifiedUsers.length === 0) {
      console.log('✅ All accounts already verified!');
      process.exit(0);
    }

    console.log(`\nFound ${unverifiedUsers.length} unverified account(s):\n`);
    unverifiedUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.name})`);
    });

    console.log('\n⏳ Marking all as verified...');
    const updateResult = await pool.query(
      'UPDATE users SET verified = true WHERE verified = false'
    );

    console.log(`✅ Successfully verified ${updateResult.rowCount} account(s)!\n`);

    console.log('√ Verified Accounts:');
    const verified = await pool.query(
      'SELECT id, email, name, verified FROM users WHERE verified = true'
    );
    verified.rows.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} ✓`);
    });

    console.log('\n✨ You can now login with these accounts!');
    console.log('🔗 Go to: https://smpmps-test.onrender.com/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAllAccounts();
