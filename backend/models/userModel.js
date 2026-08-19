const db = require('../config/db');

async function findActiveUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT user_id, email, password_hash, role, is_active
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findUserById(userId) {
  const { rows } = await db.query(
    `SELECT user_id, email, password_hash, role
     FROM users
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
    [passwordHash, userId],
  );
}

module.exports = { findActiveUserByEmail, findUserById, updatePassword };

