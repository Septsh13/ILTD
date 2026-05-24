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
  await pool.query('DROP TABLE IF EXISTS govt_officials, cha_agents CASCADE');

  const { rows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('govt_officials', 'cha_agents')
    ORDER BY table_name
  `);

  console.log(`Remaining legacy tables: ${rows.length}`);
  console.table(rows);
  await pool.end();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
