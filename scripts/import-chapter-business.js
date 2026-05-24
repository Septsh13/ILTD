require('dotenv').config();
const { pool } = require('../config/db');
const { analyzeChapterWorkbook, importChapterWorkbook } = require('../services/chapterImportService');

const filePath = process.argv[2];
const analyzeOnly = process.argv.includes('--analyze');

async function main() {
  if (!filePath) {
    throw new Error('Usage: node scripts/import-chapter-business.js <xlsx-file-path> [--analyze]');
  }

  if (analyzeOnly) {
    console.log(JSON.stringify(analyzeChapterWorkbook(filePath), null, 2));
    return;
  }

  const result = await importChapterWorkbook(filePath, null);
  console.log(JSON.stringify({
    importLogId: result.importLogId,
    totalRows: result.totalRows,
    validRows: result.validRows,
    invalidRows: result.invalidRows,
    insertedUsers: result.insertedUsers,
    updatedUsers: result.updatedUsers,
    insertedChapters: result.insertedChapters,
    updatedChapters: result.updatedChapters,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
