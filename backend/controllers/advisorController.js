const multer = require('multer');

const db = require('../config/db');
const advisorSelfModel = require('../models/advisorSelfModel');
const eventModel = require('../models/eventModel');
const { parseAttendanceBuffer } = require('../services/attendanceParser');
const { makeError } = require('../utils/validators');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const ok = name.endsWith('.xlsx') || name.endsWith('.csv');
    if (!ok) return cb(makeError(400, 'Invalid file type. Only .xlsx and .csv allowed.'));
    return cb(null, true);
  },
});

async function requireScope(advisor, event) {
  if (event.program_code !== advisor.program_code || Number(event.semester) !== Number(advisor.semester)) {
    throw makeError(403, 'This event does not belong to your assigned program/semester');
  }
}

async function getTheorySubjectsForEvent(event) {
  const { rows } = await db.query(
    `SELECT subject_id, subject_code, short_code, type
     FROM subjects
     WHERE program_code = $1 AND semester = $2`,
    [event.program_code, event.semester],
  );
  return rows;
}

async function missingRegisteredStudents(eventId, regNosPresent) {
  const { rows } = await db.query(
    `SELECT s.reg_no
     FROM registrations r
     JOIN students s ON r.student_id = s.student_id
     WHERE r.event_id = $1 AND r.payment_status = 'CONFIRMED'`,
    [eventId],
  );
  return rows
    .map((r) => r.reg_no)
    .filter((reg) => !regNosPresent.has(reg));
}

async function listAdvisorEvents(req, res, next) {
  try {
    const advisor = await advisorSelfModel.getAdvisorById(req.user.user_id);
    if (!advisor) throw makeError(404, 'Not Found');
    const { rows } = await db.query(
      `SELECT event_id, program_code, semester, event_type, academic_year,
              registration_start, registration_end
       FROM exam_events
       WHERE program_code = $1 AND semester = $2 AND is_cancelled = FALSE
       ORDER BY registration_start DESC`,
      [advisor.program_code, advisor.semester]
    );
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function previewAttendance(req, res, next) {
  try {
    const advisor = await advisorSelfModel.getAdvisorById(req.user.user_id);
    if (!advisor) throw makeError(404, 'Not Found');
    if (advisor.is_active === false) throw makeError(401, 'Unauthorized');

    const eventId = Number.parseInt(req.body.event_id || req.query.event_id, 10);
    if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');
    if (!req.file?.buffer) throw makeError(400, 'file is required');

    const event = await eventModel.getEventById(eventId);
    if (!event) throw makeError(404, 'Not Found');
    await requireScope(advisor, event);

    const subjects = await getTheorySubjectsForEvent(event);
    const parsed = parseAttendanceBuffer({ buffer: req.file.buffer, subjects });

    // Identify unknown reg_nos by checking against students
    const regNos = Array.from(parsed.regNosPresent);
    const { rows: known } = await db.query(
      `SELECT reg_no FROM students WHERE reg_no = ANY($1::text[])`,
      [regNos],
    );
    const knownSet = new Set(known.map((r) => r.reg_no));
    const unknownRegNos = regNos.filter((r) => !knownSet.has(r));

    const missing = await missingRegisteredStudents(eventId, parsed.regNosPresent);

    return res.status(200).json({
      totalRows: parsed.totalRows,
      recognisedSubjects: parsed.recognisedSubjects,
      ignoredColumns: parsed.ignoredColumns,
      unknownRegNos,
      missingRegisteredStudents: missing,
      preview: parsed.preview,
    });
  } catch (err) {
    return next(err);
  }
}

async function confirmAttendance(req, res, next) {
  const client = await db.pool.connect();
  try {
    const advisor = await advisorSelfModel.getAdvisorById(req.user.user_id);
    if (!advisor) throw makeError(404, 'Not Found');
    if (advisor.is_active === false) throw makeError(401, 'Unauthorized');

    const eventId = Number.parseInt(req.body.event_id || req.query.event_id, 10);
    if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');
    if (!req.file?.buffer) throw makeError(400, 'file is required');

    const event = await eventModel.getEventById(eventId);
    if (!event) throw makeError(404, 'Not Found');
    await requireScope(advisor, event);

    const subjects = await getTheorySubjectsForEvent(event);
    const parsed = parseAttendanceBuffer({ buffer: req.file.buffer, subjects });

    const regNos = Array.from(parsed.regNosPresent);
    const { rows: students } = await db.query(
      `SELECT student_id, reg_no FROM students WHERE reg_no = ANY($1::text[])`,
      [regNos],
    );
    const byReg = new Map(students.map((s) => [s.reg_no, s.student_id]));

    const skippedDetails = [];
    let saved = 0;

    await client.query('BEGIN');

    for (const row of parsed.parsed) {
      const studentId = byReg.get(row.reg_no);
      if (!studentId) {
        skippedDetails.push({ reg_no: row.reg_no, reason: 'Unknown registration number' });
        continue;
      }

      for (const e of row.entries) {
        const pct = Number.isFinite(e.attendance_percentage) ? e.attendance_percentage : 0.0;
        if (pct > 100) {
          skippedDetails.push({ reg_no: row.reg_no, reason: 'Attendance value exceeds 100' });
          continue;
        }
        await client.query(
          `INSERT INTO attendance (student_id, subject_id, event_id, attendance_percentage)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (student_id, subject_id, event_id)
           DO UPDATE SET attendance_percentage = EXCLUDED.attendance_percentage,
                         updated_at = CURRENT_TIMESTAMP`,
          [studentId, e.subject_id, eventId, pct],
        );
        saved += 1;
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      saved,
      skipped: skippedDetails.length,
      skippedDetails,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

async function listAdvisorStudents(req, res, next) {
  try {
    const advisor = await advisorSelfModel.getAdvisorById(req.user.user_id);
    if (!advisor) throw makeError(404, 'Not Found');
    if (advisor.is_active === false) throw makeError(401, 'Unauthorized');

    const eventId = req.query.event_id ? Number.parseInt(req.query.event_id, 10) : null;
    let registeredSet = new Set();
    if (Number.isInteger(eventId)) {
      const event = await eventModel.getEventById(eventId);
      if (!event) throw makeError(404, 'Not Found');
      await requireScope(advisor, event);
      const { rows } = await db.query(
        `SELECT s.student_id
         FROM registrations r
         JOIN students s ON r.student_id = s.student_id
         WHERE r.event_id = $1`,
        [eventId],
      );
      registeredSet = new Set(rows.map((r) => r.student_id));
    }

    const { rows } = await db.query(
      `SELECT student_id, reg_no, name, email, program_code, semester, cgpa, status
       FROM students
       WHERE program_code = $1 AND semester = $2
       ORDER BY reg_no`,
      [advisor.program_code, advisor.semester],
    );

    // Fetch latest attendance for each student (most recent event)
    const studentIds = rows.map(s => s.student_id);
    let attendanceMap = {};
    if (studentIds.length > 0) {
      const { rows: attRows } = await db.query(
        `SELECT DISTINCT ON (a.student_id)
                a.student_id,
                a.attendance_percentage,
                s.subject_code,
                s.subject_name,
                e.academic_year,
                e.event_type
         FROM attendance a
         JOIN subjects s ON s.subject_id = a.subject_id
         JOIN exam_events e ON e.event_id = a.event_id
         WHERE a.student_id = ANY($1::int[])
           AND e.program_code = $2
           AND e.semester = $3
         ORDER BY a.student_id, e.exam_start DESC NULLS LAST`,
        [studentIds, advisor.program_code, advisor.semester],
      );
      attRows.forEach(r => { attendanceMap[r.student_id] = r; });
    }

    const out = rows.map((s) => ({
      student_id: s.student_id,
      reg_no: s.reg_no,
      name: s.name,
      email: s.email,
      program_code: s.program_code,
      semester: s.semester,
      cgpa: s.cgpa,
      status: s.status,
      registered_for_event: Number.isInteger(eventId) ? registeredSet.has(s.student_id) : false,
      latest_attendance: attendanceMap[s.student_id] || null,
    }));
    return res.status(200).json(out);
  } catch (err) {
    return next(err);
  }
}

async function advisorDashboard(req, res, next) {
  try {
    const advisor = await advisorSelfModel.getAdvisorById(req.user.user_id);
    if (!advisor) throw makeError(404, 'Advisor not found');

    const [studentsRes, pendingAttRes, confirmedRegsRes] = await Promise.all([
      // Total assigned students
      db.query(
        `SELECT COUNT(*)::int AS cnt FROM students
         WHERE program_code = $1 AND semester = $2`,
        [advisor.program_code, advisor.semester]
      ),
      // Events in advisor's scope that are missing attendance
      db.query(
        `SELECT COUNT(*)::int AS cnt
         FROM exam_events e
         WHERE e.program_code = $1 AND e.semester = $2
           AND e.is_cancelled = FALSE
           AND NOT EXISTS (
             SELECT 1 FROM attendance a WHERE a.event_id = e.event_id
           )`,
        [advisor.program_code, advisor.semester]
      ),
      // Confirmed registrations for students in this scope
      db.query(
        `SELECT COUNT(*)::int AS cnt
         FROM registrations r
         JOIN students s ON r.student_id = s.student_id
         WHERE s.program_code = $1 AND s.semester = $2
           AND r.payment_status = 'CONFIRMED'`,
        [advisor.program_code, advisor.semester]
      ),
    ]);

    return res.status(200).json({
      assigned_students: studentsRes.rows[0].cnt,
      pending_attendance: pendingAttRes.rows[0].cnt,
      confirmed_registrations: confirmedRegsRes.rows[0].cnt,
      program_code: advisor.program_code,
      semester: advisor.semester,
      name: advisor.name,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  upload,
  previewAttendance,
  confirmAttendance,
  listAdvisorStudents,
  advisorDashboard,
  listAdvisorEvents,
};


