const db = require('../config/db');

async function findStudentByRegNo(regNo) {
  const { rows } = await db.query(
    `SELECT student_id, reg_no, password_hash
     FROM students
     WHERE reg_no = $1
     LIMIT 1`,
    [regNo],
  );
  return rows[0] || null;
}

async function findStudentById(studentId) {
  const { rows } = await db.query(
    `SELECT student_id, reg_no, password_hash
     FROM students
     WHERE student_id = $1
     LIMIT 1`,
    [studentId],
  );
  return rows[0] || null;
}

async function updatePassword(studentId, passwordHash) {
  await db.query(
    `UPDATE students SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2`,
    [passwordHash, studentId],
  );
}

module.exports = { findStudentByRegNo, findStudentById, updatePassword };

