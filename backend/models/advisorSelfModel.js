const db = require('../config/db');

async function getAdvisorById(userId) {
  const { rows } = await db.query(
    `SELECT user_id, name, email, program_code, semester, is_active
     FROM users
     WHERE user_id = $1 AND role = 'advisor'
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

module.exports = { getAdvisorById };

