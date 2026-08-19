const db = require('../config/db');

async function getStudentById(studentId) {
  const { rows } = await db.query(
    `SELECT s.student_id, s.reg_no, s.name, s.email, s.program_code, s.semester,
            s.status, s.profile_photo_url AS photo_url, s.cgpa, s.admission_year,
            COALESCE(
              (SELECT COUNT(*)::int FROM registrations r
               WHERE r.student_id = s.student_id AND r.payment_status = 'CONFIRMED'), 0
            ) AS active_registrations,
            COALESCE(
              (SELECT COUNT(*)::int FROM registrations r
               JOIN exam_events e ON r.event_id = e.event_id
               WHERE r.student_id = s.student_id
                 AND r.payment_status = 'CONFIRMED'
                 AND e.exam_end >= CURRENT_DATE), 0
            ) AS upcoming_exams
     FROM students s
     WHERE s.student_id = $1
     LIMIT 1`,
    [studentId],
  );
  return rows[0] || null;
}

async function updateStudentPhoto(studentId, photoUrl) {
  const { rows } = await db.query(
    `UPDATE students
     SET profile_photo_url = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE student_id = $1
     RETURNING profile_photo_url`,
    [studentId, photoUrl],
  );
  return rows[0] || null;
}

module.exports = {
  getStudentById,
  updateStudentPhoto,
};

