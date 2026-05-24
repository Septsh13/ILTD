/**
 * Environment variable validation for the GSN API.
 */

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please populate your .env file and restart the server.');
    process.exit(1);
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET.trim();

  console.log('Environment variables validated');
};

module.exports = { validateEnv };
