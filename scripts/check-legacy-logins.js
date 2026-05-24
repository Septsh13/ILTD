require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const legacyRoles = ['CHA_AGENT', 'GOVT_OFFICIAL', 'GOVERNMENT_OFFICIAL'];

const run = async () => {
  const { rows } = await pool.query(`
    SELECT employee_id, full_name, email, role::text AS role
    FROM users
    WHERE role::text = ANY($1)
    ORDER BY role, employee_id
  `, [legacyRoles]);

  console.log(`Legacy login users found: ${rows.length}`);
  console.table(rows);
  await pool.end();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
