const db = require('../config/db');

async function listRegistrationsByEvent(eventId) {
  const { rows } = await db.query(
    `SELECT r.registration_id,
            r.student_id,
            s.reg_no,
            s.name,
            r.payment_status,
            r.fee_paid,
            r.is_grace,
            r.registration_date
     FROM registrations r
     JOIN students s ON r.student_id = s.student_id
     WHERE r.event_id = $1
     ORDER BY r.registration_date DESC, r.registration_id DESC`,
    [eventId],
  );
  return rows;
}

async function getRegistrationWithEvent(registrationId, client) {
  const runner = client || db;
  const { rows } = await runner.query(
    `SELECT r.*, e.event_type, e.base_fee, e.late_fee, e.registration_end, e.late_fee_end, e.program_code, e.semester, e.minimum_cgpa
     FROM registrations r
     JOIN exam_events e ON r.event_id = e.event_id
     WHERE r.registration_id = $1
     LIMIT 1`,
    [registrationId],
  );
  return rows[0] || null;
}

async function getStudentById(studentId, client) {
  const runner = client || db;
  const { rows } = await runner.query(
    `SELECT student_id, reg_no, name, program_code, semester
     FROM students
     WHERE student_id = $1
     LIMIT 1`,
    [studentId],
  );
  return rows[0] || null;
}

module.exports = {
  listRegistrationsByEvent,
  getRegistrationWithEvent,
  getStudentById,
};

