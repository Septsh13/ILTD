require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const run = async () => {
  const { rows } = await pool.query(`
    SELECT employee_id, full_name, role::text AS role
    FROM users
    WHERE employee_id = ANY($1)
    ORDER BY employee_id
  `, [['admin', 'CP1', 'user']]);

  console.table(rows);
  await pool.end();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
