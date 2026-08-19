const db = require('../config/db');

async function getRegistrationByStudentAndEvent(studentId, eventId) {
  const { rows } = await db.query(
    `SELECT *
     FROM registrations
     WHERE student_id = $1 AND event_id = $2
     LIMIT 1`,
    [studentId, eventId],
  );
  return rows[0] || null;
}

async function createRegistration({
  student_id,
  event_id,
  arrear_subject_ids,
  is_grace = false,
}) {
  const { rows } = await db.query(
    `INSERT INTO registrations (student_id, event_id, payment_status, arrear_subject_ids, is_grace)
     VALUES ($1, $2, 'INITIATED', $3, $4)
     RETURNING registration_id, payment_status`,
    [student_id, event_id, arrear_subject_ids || null, is_grace],
  );
  return rows[0];
}

async function updateFailedToInitiated(registrationId, arrear_subject_ids) {
  const { rows } = await db.query(
    `UPDATE registrations
     SET payment_status = 'INITIATED',
         arrear_subject_ids = COALESCE($2, arrear_subject_ids),
         updated_at = CURRENT_TIMESTAMP
     WHERE registration_id = $1
     RETURNING registration_id, payment_status`,
    [registrationId, arrear_subject_ids || null],
  );
  return rows[0] || null;
}

async function listStudentRegistrations(studentId) {
  const { rows } = await db.query(
    `SELECT r.registration_id,
            r.event_id,
            e.program_code,
            e.semester,
            e.academic_year,
            e.event_type,
            r.payment_status,
            r.fee_paid
     FROM registrations r
     JOIN exam_events e ON r.event_id = e.event_id
     WHERE r.student_id = $1
     ORDER BY r.registration_date DESC, r.registration_id DESC`,
    [studentId],
  );
  return rows;
}

async function getConfirmedRegistration(studentId, eventId) {
  const { rows } = await db.query(
    `SELECT r.*
     FROM registrations r
     WHERE r.student_id = $1
       AND r.event_id = $2
       AND r.payment_status = 'CONFIRMED'
     LIMIT 1`,
    [studentId, eventId],
  );
  return rows[0] || null;
}

module.exports = {
  getRegistrationByStudentAndEvent,
  createRegistration,
  updateFailedToInitiated,
  listStudentRegistrations,
  getConfirmedRegistration,
};

