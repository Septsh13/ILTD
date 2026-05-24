require('dotenv').config();
const { pool } = require('../config/db');
const { IMPORT_KEY } = require('../services/chapterImportService');

async function main() {
  const query = async (sql, params = []) => (await pool.query(sql, params)).rows;
  const result = {
    importedUsers: await query('SELECT COUNT(1)::int AS count FROM users WHERE import_key = $1', [IMPORT_KEY]),
    importedChapters: await query('SELECT COUNT(1)::int AS count FROM chapters WHERE import_key = $1', [IMPORT_KEY]),
    analytics: await query(`
      SELECT c.name, ca.reported_member_count, ca.total_referrals_generated, ca.total_meetings_conducted
      FROM chapter_analytics ca
      JOIN chapters c ON c.id = ca.chapter_id
      ORDER BY c.name
    `),
    latestImport: await query(`
      SELECT status, total_rows, valid_rows, invalid_rows,
             inserted_users, updated_users, inserted_chapters, updated_chapters
      FROM import_logs
      ORDER BY started_at DESC
      LIMIT 1
    `),
  };
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
