const db = require('../config/db');

async function dashboardSummary() {
  const { rows } = await db.query(
    `SELECT e.event_id,
            e.program_code,
            e.semester,
            e.event_type,
            e.academic_year,
            COALESCE(SUM(CASE WHEN r.payment_status = 'CONFIRMED' THEN 1 ELSE 0 END), 0)::int AS confirmed_registrations,
            COALESCE(SUM(CASE WHEN r.payment_status IN ('INITIATED','FAILED') THEN 1 ELSE 0 END), 0)::int AS pending_registrations,
            EXISTS (SELECT 1 FROM attendance a WHERE a.event_id = e.event_id) AS attendance_uploaded,
            EXISTS (SELECT 1 FROM exam_schedule s WHERE s.event_id = e.event_id) AS schedule_created
     FROM exam_events e
     LEFT JOIN registrations r ON r.event_id = e.event_id
     WHERE e.is_cancelled = FALSE
     GROUP BY e.event_id
     ORDER BY e.registration_start DESC, e.event_id DESC`,
  );
  return rows;
}

async function preflightCounts(eventId) {
  const [{ rows: a }, { rows: s }, { rows: c }] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS cnt FROM attendance WHERE event_id = $1`, [eventId]),
    db.query(`SELECT COUNT(*)::int AS cnt FROM exam_schedule WHERE event_id = $1`, [eventId]),
    db.query(`SELECT COUNT(*)::int AS cnt FROM registrations WHERE event_id = $1 AND payment_status = 'CONFIRMED'`, [eventId]),
  ]);
  return { attendance: a[0].cnt, schedule: s[0].cnt, confirmed: c[0].cnt };
}

async function listConfirmedRegistrationsWithStudent(eventId) {
  const { rows } = await db.query(
    `SELECT r.registration_id,
            s.student_id,
            s.reg_no,
            s.name,
            s.program_code,
            s.semester,
            s.profile_photo_url
     FROM registrations r
     JOIN students s ON r.student_id = s.student_id
     WHERE r.event_id = $1 AND r.payment_status = 'CONFIRMED'
     ORDER BY s.reg_no`,
    [eventId],
  );
  return rows;
}

async function registrationSnapshotWithAttendance({ registrationId, studentId, eventId }) {
  const { rows } = await db.query(
    `SELECT s.subject_id,
            s.subject_code,
            s.subject_name,
            COALESCE(a.attendance_percentage, NULL) AS attendance_percentage
     FROM registration_subjects rs
     JOIN subjects s ON rs.subject_id = s.subject_id
     LEFT JOIN attendance a
       ON a.subject_id = s.subject_id
      AND a.student_id = $1
      AND a.event_id = $2
     WHERE rs.registration_id = $3
     ORDER BY s.subject_code`,
    [studentId, eventId, registrationId],
  );
  return rows;
}

async function scheduleByEvent(eventId) {
  const { rows } = await db.query(
    `SELECT es.subject_id,
            to_char(es.exam_date, 'YYYY-MM-DD') AS exam_date,
            to_char(es.start_time, 'HH24:MI') AS start_time,
            to_char(es.end_time, 'HH24:MI') AS end_time,
            es.session,
            es.is_honors
     FROM exam_schedule es
     WHERE es.event_id = $1`,
    [eventId],
  );
  return rows;
}

module.exports = {
  dashboardSummary,
  preflightCounts,
  listConfirmedRegistrationsWithStudent,
  registrationSnapshotWithAttendance,
  scheduleByEvent,
};

