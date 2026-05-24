/**
 * Environment variable validation
 * Fails fast at startup if required vars are missing
 */

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Please populate your .env file and restart the server.');
    process.exit(1);
  }

  // Trim hidden carriage returns from Windows-style (CRLF) .env files
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.trim();
  process.env.JWT_SECRET     = process.env.JWT_SECRET.trim();

  if (process.env.ENCRYPTION_KEY.length !== 32) {
    console.error(`❌ ENCRYPTION_KEY must be exactly 32 characters (got ${process.env.ENCRYPTION_KEY.length}).`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};

module.exports = { validateEnv };
