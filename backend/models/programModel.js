const db = require('../config/db');

async function createProgram({ program_code, degree_type, branch_name }) {
  const { rows } = await db.query(
    `INSERT INTO programs (program_code, degree_type, branch_name)
     VALUES ($1, $2, $3)
     RETURNING program_code`,
    [program_code, degree_type, branch_name],
  );
  return rows[0];
}

async function listPrograms() {
  const { rows } = await db.query(
    `SELECT program_code, degree_type, branch_name
     FROM programs
     ORDER BY program_code`,
  );
  return rows;
}

async function updateProgram(program_code, { degree_type, branch_name }) {
  const { rows } = await db.query(
    `UPDATE programs
     SET degree_type = $2,
         branch_name = $3
     WHERE program_code = $1
     RETURNING program_code`,
    [program_code, degree_type, branch_name],
  );
  return rows[0] || null;
}

async function deleteProgram(program_code) {
  await db.query(`DELETE FROM programs WHERE program_code = $1`, [program_code]);
}

module.exports = {
  createProgram,
  listPrograms,
  updateProgram,
  deleteProgram,
};

