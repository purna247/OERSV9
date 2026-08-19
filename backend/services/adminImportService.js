const bcrypt = require('bcrypt');

const db = require('../config/db');
const { readWorkbookFromBuffer, getFirstSheetRows } = require('./excelParser');
const { normaliseHeader, toInt } = require('../utils/validators');
const { randomAlphanumeric } = require('./passwords');
const { STUDENT_STATUS } = require('../constants/enums');

function buildHeaderIndex(headers) {
  const map = new Map();
  headers.forEach((h, idx) => {
    map.set(normaliseHeader(h), idx);
  });
  return map;
}

function getCell(row, idx) {
  if (!row || idx === undefined) return '';
  return row[idx];
}

async function importStudentsFromFileBuffer(buffer) {
  const workbook = readWorkbookFromBuffer(buffer);
  const rows = getFirstSheetRows(workbook);
  if (!rows || rows.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, skippedDetails: [], imported_credentials: [] };
  }

  const headers = rows[0];
  const idx = buildHeaderIndex(headers);

  const col = {
    regNo: idx.get('REGNO'),
    name: idx.get('NAME'),
    email: idx.get('EMAIL'),
    programCode: idx.get('PROGRAMCODE'),
    semester: idx.get('SEMESTER'),
    admissionYear: idx.get('ADMISSIONYEAR'),
    status: idx.get('STATUS'),
    cgpa: idx.get('CGPA'),
  };

  const hasStatusColumn = col.status !== undefined;

  // Deduplicate by Reg No within file (last occurrence wins)
  const byReg = new Map();
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const regRaw = String(getCell(row, col.regNo) ?? '').trim();
    if (!regRaw) continue;
    byReg.set(regRaw, { rowIndex: i + 1, row });
  }

  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const imported_credentials = [];
  const skippedDetails = [];
  let inserted = 0;
  let updated = 0;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (const [regNo, { rowIndex, row }] of byReg.entries()) {
      const name = String(getCell(row, col.name) ?? '').trim();
      const email = String(getCell(row, col.email) ?? '').trim() || null;
      const program_code = String(getCell(row, col.programCode) ?? '').trim();
      const semester = toInt(getCell(row, col.semester), null);
      const admission_year = toInt(getCell(row, col.admissionYear), 2023);

      let status = STUDENT_STATUS.ACTIVE;
      if (hasStatusColumn) {
        const s = String(getCell(row, col.status) ?? '').trim().toUpperCase();
        if (!s) status = STUDENT_STATUS.ACTIVE;
        else if ([STUDENT_STATUS.ACTIVE, STUDENT_STATUS.DETAINED, STUDENT_STATUS.GRADUATED].includes(s)) status = s;
        else {
          skippedDetails.push({ row: rowIndex, reg_no: regNo, reason: 'Invalid status value' });
          continue;
        }
      }

      let cgpa = getCell(row, col.cgpa);
      if (cgpa === undefined || cgpa === null || String(cgpa).trim() === '') cgpa = 0.0;
      const cgpaNum = Number.parseFloat(String(cgpa));
      if (!Number.isFinite(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        skippedDetails.push({ row: rowIndex, reg_no: regNo, reason: 'Invalid CGPA value' });
        continue;
      }

      if (!name || !program_code || !Number.isInteger(semester)) {
        skippedDetails.push({ row: rowIndex, reg_no: regNo, reason: 'Missing required fields' });
        continue;
      }

      // Check existence (and keep password_hash if exists)
      const { rows: existingRows } = await client.query(
        `SELECT student_id, password_hash
         FROM students
         WHERE reg_no = $1
         LIMIT 1`,
        [regNo],
      );
      const existing = existingRows[0] || null;

      if (!existing) {
        const temp_password = randomAlphanumeric(6);
        const hash = await bcrypt.hash(temp_password, rounds);

        await client.query(
          `INSERT INTO students (reg_no, name, email, program_code, semester, admission_year, status, cgpa, password_hash)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [regNo, name, email, program_code, semester, admission_year, status, cgpaNum.toFixed(2), hash],
        );
        inserted += 1;
        imported_credentials.push({ identifier: regNo, temp_password });
      } else {
        await client.query(
          `UPDATE students
           SET name = $2,
               email = $3,
               program_code = $4,
               semester = $5,
               admission_year = $6,
               status = $7,
               cgpa = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE reg_no = $1`,
          [regNo, name, email, program_code, semester, admission_year, status, cgpaNum.toFixed(2)],
        );
        updated += 1;
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return {
    inserted,
    updated,
    skipped: skippedDetails.length,
    skippedDetails,
    imported_credentials,
  };
}

async function importAdvisorsFromFileBuffer(buffer) {
  const workbook = readWorkbookFromBuffer(buffer);
  const rows = getFirstSheetRows(workbook);
  if (!rows || rows.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, skippedDetails: [], imported_credentials: [] };
  }

  const headers = rows[0];
  const idx = buildHeaderIndex(headers);

  const col = {
    name: idx.get('NAME'),
    email: idx.get('EMAIL'),
    programCode: idx.get('PROGRAMCODE'),
    semester: idx.get('SEMESTER'),
  };

  // Deduplicate by email within file (last occurrence wins)
  const byEmail = new Map();
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const emailRaw = String(getCell(row, col.email) ?? '').trim();
    if (!emailRaw) continue;
    byEmail.set(emailRaw, { rowIndex: i + 1, row });
  }

  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const imported_credentials = [];
  const skippedDetails = [];
  let inserted = 0;
  let updated = 0;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (const [email, { rowIndex, row }] of byEmail.entries()) {
      const name = String(getCell(row, col.name) ?? '').trim();
      const program_code = String(getCell(row, col.programCode) ?? '').trim();
      const semester = toInt(getCell(row, col.semester), null);

      if (!name || !program_code || !Number.isInteger(semester)) {
        skippedDetails.push({ row: rowIndex, identifier: email, reason: 'Missing required fields' });
        continue;
      }

      const { rows: existingRows } = await client.query(
        `SELECT user_id
         FROM users
         WHERE email = $1 AND role = 'advisor'
         LIMIT 1`,
        [email],
      );
      const existing = existingRows[0] || null;

      if (!existing) {
        const temp_password = randomAlphanumeric(6);
        const hash = await bcrypt.hash(temp_password, rounds);
        await client.query(
          `INSERT INTO users (name, email, password_hash, role, program_code, semester, is_active)
           VALUES ($1,$2,$3,'advisor',$4,$5,TRUE)`,
          [name, email, hash, program_code, semester],
        );
        inserted += 1;
        imported_credentials.push({ identifier: email, temp_password });
      } else {
        await client.query(
          `UPDATE users
           SET name = $2,
               program_code = $3,
               semester = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE email = $1 AND role = 'advisor'`,
          [email, name, program_code, semester],
        );
        updated += 1;
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { inserted, updated, skipped: skippedDetails.length, skippedDetails, imported_credentials };
}

async function importSubjectsFromFileBuffer(buffer) {
  const workbook = readWorkbookFromBuffer(buffer);
  const rows = getFirstSheetRows(workbook);
  if (!rows || rows.length === 0) return { inserted: 0, updated: 0, skipped: 0, skippedDetails: [] };

  const headers = rows[0];
  const idx = buildHeaderIndex(headers);
  const col = {
    subjectCode: idx.get('SUBJECTCODE'),
    shortCode: idx.get('SHORTCODE'),
    subjectName: idx.get('SUBJECTNAME'),
    programCode: idx.get('PROGRAMCODE'),
    semester: idx.get('SEMESTER'),
    type: idx.get('TYPE'),
    credits: idx.get('CREDITS'),
  };

  const skippedDetails = [];
  let inserted = 0;
  let updated = 0;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const rowIndex = i + 1;
      const subject_code = String(getCell(row, col.subjectCode) ?? '').trim();
      const short_code_raw = String(getCell(row, col.shortCode) ?? '').trim();
      const subject_name = String(getCell(row, col.subjectName) ?? '').trim();
      const program_code = String(getCell(row, col.programCode) ?? '').trim();
      const semester = toInt(getCell(row, col.semester), null);
      const type = String(getCell(row, col.type) ?? '').trim().toUpperCase();
      const credits = toInt(getCell(row, col.credits), 0);

      if (!subject_code) continue;

      if (/^X+$/i.test(subject_code)) continue;
      if (subject_code.includes('/')) {
        skippedDetails.push({ row: rowIndex, subject_code, reason: 'elective pair — manual handling needed' });
        continue;
      }
      if (type !== 'THEORY' && type !== 'LAB') {
        skippedDetails.push({ row: rowIndex, subject_code, reason: 'Invalid subject Type' });
        continue;
      }
      if (!subject_name || !program_code || !Number.isInteger(semester)) {
        skippedDetails.push({ row: rowIndex, subject_code, reason: 'Missing required fields' });
        continue;
      }

      const short_code = short_code_raw ? normaliseHeader(short_code_raw) : null;

      const { rows: upsertRows } = await client.query(
        `INSERT INTO subjects (subject_code, short_code, subject_name, program_code, semester, type, credits)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (subject_code, program_code, semester)
         DO UPDATE SET short_code = EXCLUDED.short_code,
                       subject_name = EXCLUDED.subject_name,
                       type = EXCLUDED.type,
                       credits = EXCLUDED.credits
         RETURNING (xmax = 0) AS inserted`,
        [subject_code, short_code, subject_name, program_code, semester, type, credits],
      );
      if (upsertRows[0]?.inserted) inserted += 1;
      else updated += 1;
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { inserted, updated, skipped: skippedDetails.length, skippedDetails };
}

async function importBacklogsFromFileBuffer(buffer) {
  const workbook = readWorkbookFromBuffer(buffer);
  const rows = getFirstSheetRows(workbook);
  if (!rows || rows.length === 0) return { inserted: 0, updated: 0, skipped: 0, skippedDetails: [] };

  const headers = rows[0];
  const idx = buildHeaderIndex(headers);
  const col = {
    regNo: idx.get('REGNO'),
    subjectCode: idx.get('SUBJECTCODE'),
  };

  const skippedDetails = [];
  let inserted = 0;
  let updated = 0;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const rowIndex = i + 1;
      const reg_no = String(getCell(row, col.regNo) ?? '').trim();
      const subject_code = String(getCell(row, col.subjectCode) ?? '').trim();
      if (!reg_no || !subject_code) continue;

      const { rows: stuRows } = await client.query(
        `SELECT student_id FROM students WHERE reg_no = $1 LIMIT 1`,
        [reg_no],
      );
      const student = stuRows[0];
      if (!student) {
        skippedDetails.push({ row: rowIndex, reg_no, reason: 'Unknown registration number' });
        continue;
      }

      const { rows: subRows } = await client.query(
        `SELECT subject_id FROM subjects WHERE subject_code = $1 LIMIT 1`,
        [subject_code],
      );
      const subject = subRows[0];
      if (!subject) {
        skippedDetails.push({ row: rowIndex, reg_no, reason: 'Unknown subject code' });
        continue;
      }

      // Rule: if existing is CLEARED, do NOT overwrite to PENDING
      const { rows: existingRows } = await client.query(
        `SELECT status
         FROM student_backlogs
         WHERE student_id = $1 AND subject_id = $2
         LIMIT 1`,
        [student.student_id, subject.subject_id],
      );
      const existing = existingRows[0] || null;
      if (existing?.status === 'CLEARED') continue;

      const { rows: upsertRows } = await client.query(
        `INSERT INTO student_backlogs (student_id, subject_id, status)
         VALUES ($1,$2,'PENDING')
         ON CONFLICT (student_id, subject_id)
         DO UPDATE SET status = 'PENDING',
                       updated_at = CURRENT_TIMESTAMP
         RETURNING (xmax = 0) AS inserted`,
        [student.student_id, subject.subject_id],
      );
      if (upsertRows[0]?.inserted) inserted += 1;
      else updated += 1;
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { inserted, updated, skipped: skippedDetails.length, skippedDetails };
}

module.exports = {
  importStudentsFromFileBuffer,
  importAdvisorsFromFileBuffer,
  importSubjectsFromFileBuffer,
  importBacklogsFromFileBuffer,
};

