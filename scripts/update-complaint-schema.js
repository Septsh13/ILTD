/**
 * Migration: Update complaints table schema to match requested fields
 *  - Add encrypted_name (TEXT)
 *  - Add cbi_message (TEXT)
 *  - Ensure status default is PENDING
 */
require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS encrypted_name TEXT`);
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS cbi_message TEXT`);

    // Ensure status default is PENDING
    await client.query(`ALTER TABLE complaints ALTER COLUMN status SET DEFAULT 'PENDING'`);

    await client.query('COMMIT');
    console.log('✅ complaints schema updated successfully');
  } catch (err) {
    console.error('❌ complaints schema update failed:', err.message);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();
