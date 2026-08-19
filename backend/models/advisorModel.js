const db = require('../config/db');

async function listAdvisors() {
  const { rows } = await db.query(
    `SELECT user_id, name, email, program_code, semester, is_active
     FROM users
     WHERE role = 'advisor'
     ORDER BY name`,
  );
  return rows;
}

async function setAdvisorActive(userId, isActive) {
  const { rows } = await db.query(
    `UPDATE users
     SET is_active = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND role = 'advisor'
     RETURNING user_id, is_active`,
    [userId, isActive],
  );
  return rows[0] || null;
}

module.exports = {
  listAdvisors,
  setAdvisorActive,
};

