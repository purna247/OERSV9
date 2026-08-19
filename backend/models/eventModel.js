const db = require('../config/db');

async function getEventById(eventId) {
  const { rows } = await db.query(
    `SELECT *
     FROM exam_events
     WHERE event_id = $1
     LIMIT 1`,
    [eventId],
  );
  return rows[0] || null;
}

async function listStudentVisibleEvents({ program_code, semester, student_id }) {
  const { rows } = await db.query(
    `
    WITH arrear_semesters AS (
      SELECT DISTINCT s.semester AS sem
      FROM student_backlogs sb
      JOIN subjects s ON sb.subject_id = s.subject_id
      WHERE sb.student_id = $1
        AND sb.status = 'PENDING'
        AND s.program_code = $2
        AND s.semester < $3
    )
    SELECT e.*,
           r.registration_id,
           r.payment_status  AS reg_payment_status,
           r.fee_paid        AS reg_fee_paid
    FROM exam_events e
    LEFT JOIN registrations r
      ON r.event_id = e.event_id AND r.student_id = $1
    WHERE e.program_code = $2
      AND (
        (e.event_type = 'REGULAR' AND e.semester = $3)
        OR
        (e.event_type = 'ARREAR' AND e.semester IN (SELECT sem FROM arrear_semesters))
      )
      AND e.is_cancelled = FALSE
      AND CURRENT_DATE <= e.late_fee_end
    ORDER BY e.registration_start DESC, e.event_id DESC
  `,
    [student_id, program_code, semester],
  );
  return rows;
}

module.exports = {
  getEventById,
  listStudentVisibleEvents,
};

