const fs = require('fs');
const path = require('path');
const multer = require('multer');

const studentProfileModel = require('../models/studentProfileModel');
const eventModel = require('../models/eventModel');
const subjectModel = require('../models/subjectModel');
const registrationModel = require('../models/registrationModel');
const { STUDENT_STATUS, EVENT_TYPE } = require('../constants/enums');
const { getRegistrationStatusAndFee } = require('../services/feeService');
const { generateAdmitCardPdf } = require('../services/pdfGenerator');
const { makeError } = require('../utils/validators');

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = ['.jpg', '.jpeg', '.png'].includes(ext);
    if (!ok) return cb(makeError(400, 'Invalid file type. Only JPG, JPEG, PNG allowed.'));
    return cb(null, true);
  },
});

async function profile(req, res, next) {
  try {
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');
    return res.status(200).json(student);
  } catch (err) {
    return next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) throw makeError(400, 'photo is required');
    const base64Str = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Str}`;
    const updated = await studentProfileModel.updateStudentPhoto(req.user.user_id, dataUrl);
    return res.status(200).json({ profile_photo_url: updated.profile_photo_url, message: 'Photo uploaded successfully' });
  } catch (err) {
    return next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const events = await eventModel.listStudentVisibleEvents({
      program_code: student.program_code,
      semester: student.semester,
      student_id: student.student_id,
    });

    const shaped = events.map((e) => {
      let fee_applicable = Number(e.base_fee);
      let registration_status = 'CLOSED';
      try {
        const r = getRegistrationStatusAndFee(e);
        fee_applicable = r.fee;
        registration_status = r.status;
      } catch (_err) {
        fee_applicable = Number(e.base_fee);
        registration_status = 'CLOSED';
      }
      return {
        event_id: e.event_id,
        program_code: e.program_code,
        semester: e.semester,
        academic_year: e.academic_year,
        event_type: e.event_type,
        registration_start: e.registration_start,
        registration_end: e.registration_end,
        late_fee_end: e.late_fee_end,
        base_fee: e.base_fee,
        late_fee: e.late_fee,
        minimum_cgpa: e.minimum_cgpa,
        fee_applicable,
        registration_status,
        // registration info for this student (null if not registered)
        registration_id: e.registration_id || null,
        already_registered: !!e.registration_id,
        reg_payment_status: e.reg_payment_status || null,
        reg_fee_paid: e.reg_fee_paid != null ? Number(e.reg_fee_paid) : null,
      };
    });

    return res.status(200).json(shaped);
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const { event_id, subject_ids } = req.body || {};
    if (!event_id) throw makeError(400, 'event_id is required');

    const event = await eventModel.getEventById(event_id);
    if (!event) throw makeError(404, 'Not Found');

    // Student routes should not allow cross-program/semester regular events
    if (event.program_code !== student.program_code) throw makeError(403, 'Event does not belong to this student');

    // 1. status must be ACTIVE
    if (student.status !== STUDENT_STATUS.ACTIVE) {
      throw makeError(403, 'Student is not eligible to register');
    }

    // 2. At least one THEORY subject must exist for student program/semester
    const theoryCount = await subjectModel.countTheorySubjects(student.program_code, student.semester);
    if (theoryCount === 0) throw makeError(400, 'Subjects not configured. Contact admin.');

    // 3. Existing registration in INITIATED/FAILED should resume (no new row)
    const existing = await registrationModel.getRegistrationByStudentAndEvent(student.student_id, event.event_id);
    if (existing && (existing.payment_status === 'INITIATED' || existing.payment_status === 'FAILED')) {
      if (existing.payment_status === 'FAILED') {
        await registrationModel.updateFailedToInitiated(existing.registration_id, event.event_type === EVENT_TYPE.ARREAR ? subject_ids : null);
      }
      const { fee } = getRegistrationStatusAndFee(event, { isGrace: existing.is_grace });
      return res.status(201).json({ registration_id: existing.registration_id, payment_status: 'INITIATED', fee_to_pay: fee });
    }

    // Fee window check (creates new row only if open)
    const { fee } = getRegistrationStatusAndFee(event);

    // 4. CGPA check — only applies for ODD semesters (year-end promotion gate).
    //    Even semesters (2,4,6,8) are automatic progression within the same academic year;
    //    the student is already enrolled so no CGPA gate applies at registration time.
    const isOddSemester = Number(event.semester) % 2 !== 0;
    if (isOddSemester && Number(event.semester) !== 1 && Number(event.minimum_cgpa) > 0) {
      const stuCgpa = Number(student.cgpa);
      const min = Number(event.minimum_cgpa);
      if (stuCgpa < min) {
        throw makeError(400, `Minimum CGPA of ${event.minimum_cgpa} required for promotion to Semester ${event.semester}. Your CGPA: ${student.cgpa}`);
      }
    }

    // 5/6/7. ARREAR checks
    let arrearJson = null;
    if (event.event_type === EVENT_TYPE.ARREAR) {
      if (!Array.isArray(subject_ids) || subject_ids.length === 0) {
        throw makeError(400, 'Invalid or missing subject_ids for ARREAR event');
      }

      const ids = subject_ids.map((x) => Number(x)).filter((n) => Number.isInteger(n));
      if (ids.length === 0) throw makeError(400, 'Invalid or missing subject_ids for ARREAR event');

      // Validate subject IDs belong to program and are THEORY
      const valid = await subjectModel.validateTheorySubjectsInProgram(ids, student.program_code);
      if (valid.length === 0 || valid.length !== ids.length) {
        throw makeError(400, 'Please select at least one valid THEORY subject to register.');
      }

      // Strict backlog verification: each must be PENDING for this student
      const db = require('../config/db'); // local require to avoid cycles
      const { rows } = await db.query(
        `SELECT subject_id
         FROM student_backlogs
         WHERE student_id = $1
           AND status = 'PENDING'
           AND subject_id = ANY($2::int[])`,
        [student.student_id, ids],
      );
      if (rows.length !== ids.length) {
        throw makeError(403, 'You do not have an active backlog for one or more of the selected subjects');
      }

      arrearJson = ids;
    }

    const created = await registrationModel.createRegistration({
      student_id: student.student_id,
      event_id: event.event_id,
      arrear_subject_ids: arrearJson,
      is_grace: false,
    });

    return res.status(201).json({ registration_id: created.registration_id, payment_status: created.payment_status, fee_to_pay: fee });
  } catch (err) {
    return next(err);
  }
}

async function listRegistrations(req, res, next) {
  try {
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');
    const rows = await registrationModel.listStudentRegistrations(student.student_id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function schedule(req, res, next) {
  try {
    const eventId = Number.parseInt(req.query.event_id, 10);
    if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');

    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const db = require('../config/db');
    const { rows: regRows } = await db.query(
      `SELECT registration_id
       FROM registrations
       WHERE student_id = $1 AND event_id = $2
       LIMIT 1`,
      [student.student_id, eventId],
    );
    if (regRows.length === 0) throw makeError(404, 'Not Found');

    const { rows } = await db.query(
      `SELECT es.schedule_id,
              s.subject_code,
              s.subject_name,
              es.exam_date,
              to_char(es.start_time, 'HH24:MI') AS start_time,
              to_char(es.end_time, 'HH24:MI') AS end_time,
              es.session,
              es.is_honors
       FROM exam_schedule es
       JOIN subjects s ON es.subject_id = s.subject_id
       WHERE es.event_id = $1
       ORDER BY es.exam_date, es.start_time, s.subject_code`,
      [eventId],
    );
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function admitCardData(req, res, next) {
  try {
    const eventId = Number.parseInt(req.query.event_id, 10);
    if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');

    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const event = await eventModel.getEventById(eventId);
    if (!event) throw makeError(404, 'Not Found');

    if (event.program_code !== student.program_code) throw makeError(400, 'Event does not belong to this student');
    if (event.admit_cards_released !== true) throw makeError(400, 'Admit cards not yet released for this event');
    if (!student.photo_url) throw makeError(400, 'Profile photo missing. Please upload a photo before downloading the admit card.');

    const confirmed = await registrationModel.getConfirmedRegistration(student.student_id, eventId);
    if (!confirmed) throw makeError(404, 'No CONFIRMED registration found for this event');

    const db = require('../config/db');
    const minimumAttendance = Number(event.minimum_attendance);

    // Get branch name from programs table
    const { rows: programRows } = await db.query(
      `SELECT branch_name FROM programs WHERE program_code = $1 LIMIT 1`,
      [student.program_code],
    );
    const branchName = programRows[0]?.branch_name || student.program_code;

    const { rows: snapshotRows } = await db.query(
      `SELECT s.subject_id, s.subject_code, s.subject_name,
              COALESCE(a.attendance_percentage, NULL) AS attendance_percentage
       FROM registration_subjects rs
       JOIN subjects s ON rs.subject_id = s.subject_id
       LEFT JOIN attendance a ON a.subject_id = s.subject_id AND a.student_id = $1 AND a.event_id = $2
       WHERE rs.registration_id = $3
       ORDER BY s.subject_code`,
      [student.student_id, eventId, confirmed.registration_id],
    );

    const eligibleSubjects = snapshotRows.map((r) => {
      const pct = r.attendance_percentage === null ? null : Number(r.attendance_percentage);
      const eligible = pct !== null && pct >= minimumAttendance;
      return {
        subject_id: r.subject_id,
        subject_code: r.subject_code,
        subject_name: r.subject_name,
        attendance_percentage: pct,
        eligibility: eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      };
    });

    const eligibleCount = eligibleSubjects.filter((s) => s.eligibility === 'ELIGIBLE').length;
    if (eligibleCount === 0) throw makeError(400, 'Not eligible to appear for any exams due to attendance shortage');

    const snapshotSubjectIds = eligibleSubjects.map((s) => s.subject_id);
    const { rows: scheduleRows } = await db.query(
      `SELECT es.subject_id,
              to_char(es.exam_date, 'DD/MM/YYYY') AS exam_date,
              to_char(es.start_time, 'HH12:MIAM') AS start_time,
              to_char(es.end_time, 'HH12:MIAM') AS end_time,
              es.session, es.is_honors
       FROM exam_schedule es
       WHERE es.event_id = $1 AND (es.is_honors = FALSE OR es.subject_id = ANY($2::int[]))`,
      [eventId, snapshotSubjectIds],
    );
    const scheduleMap = {};
    scheduleRows.forEach((r) => { scheduleMap[r.subject_id] = r; });

    let photoUrl = null;
    if (student.photo_url) {
      if (student.photo_url.startsWith('http') || student.photo_url.startsWith('data:')) {
        photoUrl = student.photo_url;
      } else {
        photoUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}${student.photo_url}`;
      }
    }

    return res.status(200).json({
      student: {
        name: student.name,
        reg_no: student.reg_no,
        program_code: student.program_code,
        branch_name: branchName,
        degree_type: (programRows[0]?.degree_type || 'BACHELOR OF TECHNOLOGY').toUpperCase(),
        semester: student.semester,
        photo_url: photoUrl,
      },
      event: {
        academic_year: event.academic_year,
        event_type: event.event_type,
        exam_start: event.exam_start,
        exam_end: event.exam_end,
      },
      subjects: eligibleSubjects.map((s) => ({
        subject_id: s.subject_id,
        subject_code: s.subject_code,
        subject_name: s.subject_name,
        eligibility: s.eligibility,
        attendance_percentage: s.attendance_percentage,
        schedule: scheduleMap[s.subject_id] || null,
      })),
      minimum_attendance: minimumAttendance,
    });
  } catch (err) {
    return next(err);
  }
}

async function admitCard(req, res, next) {
  try {
    const eventId = Number.parseInt(req.query.event_id, 10);
    if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');

    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const event = await eventModel.getEventById(eventId);
    if (!event) throw makeError(404, 'Not Found');

    if (event.program_code !== student.program_code) throw makeError(400, 'Event does not belong to this student');
    if (event.admit_cards_released !== true) throw makeError(400, 'Admit cards not yet released for this event');
    if (!student.photo_url) {
      throw makeError(400, 'Profile photo missing. Please upload a photo before downloading the admit card.');
    }

    const confirmed = await registrationModel.getConfirmedRegistration(student.student_id, eventId);
    if (!confirmed) throw makeError(404, 'No CONFIRMED registration found for this event');

    const db = require('../config/db');
    const minimumAttendance = Number(event.minimum_attendance);

    const { rows: snapshotRows } = await db.query(
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
      [student.student_id, eventId, confirmed.registration_id],
    );

    const eligibleSubjects = snapshotRows.map((r) => {
      const pct = r.attendance_percentage === null ? null : Number(r.attendance_percentage);
      const eligible = pct !== null && pct >= minimumAttendance;
      return {
        subject_id: r.subject_id,
        subject_code: r.subject_code,
        subject_name: r.subject_name,
        eligibility: eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      };
    });

    const eligibleCount = eligibleSubjects.filter((s) => s.eligibility === 'ELIGIBLE').length;
    if (eligibleCount === 0) throw makeError(400, 'Not eligible to appear for any exams due to attendance shortage');

    // Honors/minors conditional schedule display:
    // include is_honors = FALSE always; include is_honors = TRUE only if subject exists in snapshot.
    const snapshotSubjectIds = eligibleSubjects.map((s) => s.subject_id);
    const { rows: scheduleRows } = await db.query(
      `SELECT es.subject_id,
              to_char(es.exam_date, 'YYYY-MM-DD') AS exam_date,
              to_char(es.start_time, 'HH24:MI') AS start_time,
              to_char(es.end_time, 'HH24:MI') AS end_time,
              es.session,
              es.is_honors
       FROM exam_schedule es
       WHERE es.event_id = $1
         AND (
           es.is_honors = FALSE
           OR es.subject_id = ANY($2::int[])
         )`,
      [eventId, snapshotSubjectIds],
    );
    const scheduleBySubjectId = new Map(scheduleRows.map((r) => [r.subject_id, r]));

    generateAdmitCardPdf({
      res,
      student,
      event,
      subjects: eligibleSubjects,
      scheduleBySubjectId,
      minimumAttendance,
    });
  } catch (err) {
    return next(err);
  }
}

async function getAttendance(req, res, next) {
  try {
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const db = require('../config/db');
    const { rows } = await db.query(
      `SELECT
         a.attendance_percentage,
         s.subject_code,
         s.subject_name,
         s.type          AS subject_type,
         e.event_id,
         e.academic_year,
         e.event_type,
         e.semester,
         e.program_code,
         e.minimum_attendance
       FROM attendance a
       JOIN subjects    s ON s.subject_id = a.subject_id
       JOIN exam_events e ON e.event_id   = a.event_id
       WHERE a.student_id = $1
       ORDER BY e.academic_year DESC, e.event_type, s.subject_code`,
      [student.student_id],
    );

    // Group by event
    const eventsMap = {};
    for (const row of rows) {
      const key = row.event_id;
      if (!eventsMap[key]) {
        eventsMap[key] = {
          event_id:           row.event_id,
          academic_year:      row.academic_year,
          event_type:         row.event_type,
          semester:           row.semester,
          program_code:       row.program_code,
          minimum_attendance: Number(row.minimum_attendance),
          subjects:           [],
        };
      }
      eventsMap[key].subjects.push({
        subject_code:          row.subject_code,
        subject_name:          row.subject_name,
        subject_type:          row.subject_type,
        attendance_percentage: Number(row.attendance_percentage),
      });
    }

    return res.status(200).json({ attendance: Object.values(eventsMap) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  photoUpload,
  profile,
  uploadPhoto,
  listEvents,
  register,
  listRegistrations,
  schedule,
  admitCard,
  admitCardData,
  getAttendance,
};

