/**
 * Encryption Service
 * AES-256-CBC encrypt/decrypt for complaint identity PII
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'utf8'); // must be 32 bytes

/**
 * Encrypt a plaintext string
 * @param {string} plaintext
 * @returns {{ encrypted: string, iv: string }}
 */
const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
};

/**
 * Decrypt an encrypted hex string
 * @param {string} encryptedHex
 * @param {string} ivHex
 * @returns {string} plaintext
 */
const decrypt = (encryptedHex, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Encrypt all PII fields in a complaint identity object
 * Returns the encrypted fields and a shared IV
 * @param {{ name: string, email: string, phone?: string }} identity
 * @returns {{ encryptedName, encryptedEmail, encryptedPhone, iv }}
 */
const encryptIdentity = (identity) => {
  // Each field gets its own IV for added security
  const nameResult  = encrypt(identity.name);
  const emailResult = encrypt(identity.email);
  const phoneResult = identity.phone ? encrypt(identity.phone) : null;

  return {
    encryptedName:  nameResult.encrypted,
    encryptedEmail: emailResult.encrypted,
    encryptedPhone: phoneResult ? phoneResult.encrypted : null,
    // Store IVs as a JSON object serialised to hex
    iv: JSON.stringify({
      name:  nameResult.iv,
      email: emailResult.iv,
      phone: phoneResult ? phoneResult.iv : null,
    }),
  };
};

/**
 * Decrypt complaint identity PII
 * @param {{ encrypted_name, encrypted_email, encrypted_phone, iv }} record
 * @returns {{ name, email, phone }}
 */
const decryptIdentity = (record) => {
  const ivMap = JSON.parse(record.iv);
  return {
    name:  decrypt(record.encrypted_name, ivMap.name),
    email: decrypt(record.encrypted_email, ivMap.email),
    phone: record.encrypted_phone && ivMap.phone
      ? decrypt(record.encrypted_phone, ivMap.phone)
      : null,
  };
};

module.exports = { encrypt, decrypt, encryptIdentity, decryptIdentity };
