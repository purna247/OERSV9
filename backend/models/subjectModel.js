const db = require('../config/db');

async function countTheorySubjects(programCode, semester) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM subjects
     WHERE program_code = $1
       AND semester = $2
       AND type = 'THEORY'`,
    [programCode, semester],
  );
  return rows[0]?.count ?? 0;
}

async function listTheorySubjectIds(programCode, semester, client) {
  const runner = client || db;
  const { rows } = await runner.query(
    `SELECT subject_id
     FROM subjects
     WHERE program_code = $1
       AND semester = $2
       AND type = 'THEORY'
     ORDER BY subject_id`,
    [programCode, semester],
  );
  return rows.map((r) => r.subject_id);
}

async function validateTheorySubjectsInProgram(subjectIds, programCode, client) {
  const runner = client || db;
  const { rows } = await runner.query(
    `SELECT subject_id
     FROM subjects
     WHERE subject_id = ANY($1::int[])
       AND program_code = $2
       AND type = 'THEORY'`,
    [subjectIds, programCode],
  );
  return rows.map((r) => r.subject_id);
}

async function listSubjects(filters = {}) {
  const { program_code, semester, type } = filters;
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
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  const sql = `
    SELECT subject_id, subject_code, short_code, subject_name, program_code, semester, type, credits
    FROM subjects
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY program_code, semester, subject_code
  `;
  const { rows } = await db.query(sql, params);
  return rows;
}

module.exports = {
  countTheorySubjects,
  listTheorySubjectIds,
  validateTheorySubjectsInProgram,
  listSubjects,
};

