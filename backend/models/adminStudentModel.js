const db = require('../config/db');

async function listStudents(filters = {}) {
  const { program_code, semester, admission_year } = filters;
  const params = [];
  const where = [];

  if (program_code) {
    params.push(program_code);
    where.push(`program_code = $${params.length}`);
  }
  if (semester !== undefined && semester !== null && semester !== '') {
    params.push(Number.parseInt(semester, 10));
    where.push(`semester = $${params.length}`);
  }
  if (admission_year !== undefined && admission_year !== null && admission_year !== '') {
    params.push(Number.parseInt(admission_year, 10));
    where.push(`admission_year = $${params.length}`);
  }

  const sql = `
    SELECT student_id, reg_no, name, email, program_code, semester, status, cgpa
    FROM students
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY program_code, semester, reg_no
  `;
  const { rows } = await db.query(sql, params);
  return rows;
}

async function setStudentStatus(studentId, status) {
  const { rows } = await db.query(
    `UPDATE students
     SET status = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE student_id = $1
     RETURNING student_id, status`,
    [studentId, status],
  );
  return rows[0] || null;
}

async function updateCgpaBulk(entries) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let updated = 0;
    for (const { student_id, cgpa } of entries) {
      const { rowCount } = await client.query(
        `UPDATE students
         SET cgpa = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $1`,
        [student_id, cgpa],
      );
      updated += rowCount;
    }
    await client.query('COMMIT');
    return updated;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function resetStudentPassword(studentId, passwordHash) {
  const { rows } = await db.query(
    `UPDATE students
     SET password_hash = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE student_id = $1
     RETURNING reg_no`,
    [studentId, passwordHash],
  );
  return rows[0] || null;
}

module.exports = {
  listStudents,
  setStudentStatus,
  updateCgpaBulk,
  resetStudentPassword,
};

