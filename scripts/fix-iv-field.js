/**
 * Migration: Fix IV field size for complaint_identity table
 * Run: node scripts/fix-iv-field.js
 */

require('dotenv').config();
const { pool } = require('../config/db');

const runMigration = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Increasing IV field size...');

    await client.query('BEGIN');

    // Alter column type from VARCHAR(64) to VARCHAR(500)
    await client.query(`
      ALTER TABLE complaint_identity 
      ALTER COLUMN iv TYPE VARCHAR(500);
    `);

    console.log('✅ Successfully increased iv field from VARCHAR(64) to VARCHAR(500)');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

runMigration();
