const bcrypt = require('bcrypt');
const crypto = require('crypto');
const multer = require('multer');

const db = require('../config/db');
const programModel = require('../models/programModel');
const subjectModel = require('../models/subjectModel');
const advisorModel = require('../models/advisorModel');
const { makeError } = require('../utils/validators');
const importService = require('../services/adminImportService');
const adminStudentModel = require('../models/adminStudentModel');
const { randomAlphanumeric } = require('../services/passwords');
const { STUDENT_STATUS } = require('../constants/enums');
const adminEventModel = require('../models/adminEventModel');
const eventModel = require('../models/eventModel');
const adminRegistrationModel = require('../models/adminRegistrationModel');
const scheduleModel = require('../models/scheduleModel');
const { parseJsonbArray } = require('../services/jsonb');
const { EVENT_TYPE } = require('../constants/enums');
const { getRegistrationStatusAndFee } = require('../services/feeService');
const adminReportModel = require('../models/adminReportModel');
const { generateAdmitCardBuffer } = require('../services/pdfGenerator');

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

async function createProgram(req, res, next) {
  try {
    const { program_code, degree_type, branch_name } = req.body || {};
    if (!program_code || !degree_type || !branch_name) throw makeError(400, 'program_code, degree_type, branch_name are required');
    const created = await programModel.createProgram({ program_code, degree_type, branch_name });
    return res.status(201).json({ program_code: created.program_code, message: 'Program created successfully' });
  } catch (err) {
    return next(err);
  }
}

async function listPrograms(_req, res, next) {
  try {
    const rows = await programModel.listPrograms();
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function updateProgram(req, res, next) {
  try {
    const programCode = req.params.id;
    const { degree_type, branch_name } = req.body || {};
    if (!degree_type || !branch_name) throw makeError(400, 'degree_type and branch_name are required');
    const updated = await programModel.updateProgram(programCode, { degree_type, branch_name });
    if (!updated) throw makeError(404, 'Not Found');
    return res.status(200).json({ program_code: updated.program_code, message: 'Program updated successfully' });
  } catch (err) {
    return next(err);
  }
}

async function deleteProgram(req, res, next) {
  try {
    const programCode = req.params.id;
    await programModel.deleteProgram(programCode);
    return res.status(200).json({ program_code: programCode, message: 'Program deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

async function listSubjects(req, res, next) {
  try {
    const { program_code, semester, type } = req.query || {};
    const rows = await subjectModel.listSubjects({ program_code, semester, type });
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function listAdvisors(_req, res, next) {
  try {
    const rows = await advisorModel.listAdvisors();
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function deactivateAdvisor(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
    const updated = await advisorModel.setAdvisorActive(id, false);
    if (!updated) throw makeError(404, 'Not Found');
    return res.status(200).json({ user_id: updated.user_id, is_active: updated.is_active, message: 'Advisor deactivated' });
  } catch (err) {
    return next(err);
  }
}

async function reactivateAdvisor(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
    const updated = await advisorModel.setAdvisorActive(id, true);
    if (!updated) throw makeError(404, 'Not Found');
    return res.status(200).json({ user_id: updated.user_id, is_active: updated.is_active, message: 'Advisor reactivated' });
  } catch (err) {
    return next(err);
  }
}

async function createAdmin(req, res, next) {
  try {
    const { name, email } = req.body || {};
    if (!name || !email) throw makeError(400, 'name and email are required');

    const suffix = crypto.randomInt(1000, 10000);
    const tempPassword = `Admin@${suffix}`;
    const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const hash = await bcrypt.hash(tempPassword, rounds);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING user_id, email`,
      [name, email, hash],
    );

    return res.status(201).json({ user_id: rows[0].user_id, email: rows[0].email, message: 'Admin account created' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  upload,
  createProgram,
  listPrograms,
  updateProgram,
  deleteProgram,
  listSubjects,
  listAdvisors,
  deactivateAdvisor,
  reactivateAdvisor,
  createAdmin,
  async uploadStudents(req, res, next) {
    try {
      if (!req.file?.buffer) throw makeError(400, 'file is required');
      const result = await importService.importStudentsFromFileBuffer(req.file.buffer);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
  async uploadAdvisors(req, res, next) {
    try {
      if (!req.file?.buffer) throw makeError(400, 'file is required');
      const result = await importService.importAdvisorsFromFileBuffer(req.file.buffer);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
  async uploadSubjects(req, res, next) {
    try {
      if (!req.file?.buffer) throw makeError(400, 'file is required');
      const result = await importService.importSubjectsFromFileBuffer(req.file.buffer);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
  async uploadBacklogs(req, res, next) {
    try {
      if (!req.file?.buffer) throw makeError(400, 'file is required');
      const result = await importService.importBacklogsFromFileBuffer(req.file.buffer);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
  async listStudents(req, res, next) {
    try {
      const rows = await adminStudentModel.listStudents(req.query || {});
      return res.status(200).json(rows);
    } catch (err) {
      return next(err);
    }
  },
  async bulkUpdateCgpa(req, res, next) {
    try {
      const body = req.body;
      if (!Array.isArray(body)) throw makeError(400, 'Request body must be an array');
      const entries = body
        .map((e) => ({
          student_id: Number.parseInt(e.student_id, 10),
          cgpa: Number.parseFloat(e.cgpa),
        }))
        .filter((e) => Number.isInteger(e.student_id) && Number.isFinite(e.cgpa));

      if (entries.length === 0) throw makeError(400, 'No valid entries provided');

      const updated = await adminStudentModel.updateCgpaBulk(entries);
      return res.status(200).json({ updated, message: 'CGPAs updated successfully' });
    } catch (err) {
      return next(err);
    }
  },
  async updateStudentStatus(req, res, next) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
      const { status } = req.body || {};
      const normalized = String(status || '').trim().toUpperCase();
      if (![STUDENT_STATUS.ACTIVE, STUDENT_STATUS.DETAINED, STUDENT_STATUS.GRADUATED].includes(normalized)) {
        throw makeError(400, 'Invalid status');
      }
      const updated = await adminStudentModel.setStudentStatus(id, normalized);
      if (!updated) throw makeError(404, 'Not Found');
      return res.status(200).json({ student_id: updated.student_id, status: updated.status, message: 'Status updated' });
    } catch (err) {
      return next(err);
    }
  },
  async resetStudentPassword(req, res, next) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');

      const temp_password = randomAlphanumeric(6);
      const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const hash = await bcrypt.hash(temp_password, rounds);

      const updated = await adminStudentModel.resetStudentPassword(id, hash);
      if (!updated) throw makeError(404, 'Not Found');

      return res.status(200).json({ reg_no: updated.reg_no, temp_password, message: 'Password reset successfully' });
    } catch (err) {
      return next(err);
    }
  },
  async createEventsBulk(req, res, next) {
    try {
      const body = req.body || {};
      const {
        programs,
        semesters,
        event_type,
        academic_year,
        registration_start,
        registration_end,
        late_fee_end,
        exam_start,
        exam_end,
      } = body;

      if (!Array.isArray(programs) || programs.length === 0) throw makeError(400, 'programs is required');
      if (!Array.isArray(semesters) || semesters.length === 0) throw makeError(400, 'semesters is required');
      if (!event_type || !academic_year) throw makeError(400, 'event_type and academic_year are required');
      if (!registration_start || !registration_end || !late_fee_end || !exam_start || !exam_end) {
        throw makeError(400, 'All date fields are required');
      }

      const rs = new Date(registration_start);
      const re = new Date(registration_end);
      const le = new Date(late_fee_end);
      const es = new Date(exam_start);
      // Validation rules (before any insert)
      if (!(re > rs)) throw makeError(400, 'registration_end must be greater than registration_start');
      if (!(le >= re)) throw makeError(400, 'late_fee_end must be greater than or equal to registration_end');
      if (!(es > le)) throw makeError(400, 'exam_start must be greater than late_fee_end');

      const payload = {
        programs: programs.map(String),
        semesters: semesters.map((s) => Number.parseInt(s, 10)).filter((n) => Number.isInteger(n)),
        event_type: String(event_type).toUpperCase(),
        academic_year: String(academic_year),
        registration_start,
        registration_end,
        late_fee_end,
        exam_start,
        exam_end,
        base_fee: Number.parseInt(body.base_fee ?? 1000, 10),
        late_fee: Number.parseInt(body.late_fee ?? 0, 10),
        minimum_cgpa: body.minimum_cgpa ?? 0.0,
        minimum_attendance: body.minimum_attendance ?? 75.0,
      };

      const result = await adminEventModel.createEventsBulk(payload);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },
  async listEvents(req, res, next) {
    try {
      const rows = await adminEventModel.listEvents();
      return res.status(200).json(rows);
    } catch (err) {
      return next(err);
    }
  },
  async deleteEvent(req, res, next) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
      const result = await adminEventModel.deleteOrCancelEvent(id);
      return res.status(200).json({ event_id: id, ...result });
    } catch (err) {
      return next(err);
    }
  },
  async publishAdmitCards(req, res, next) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
      const updated = await adminEventModel.publishAdmitCards(id);
      if (!updated) throw makeError(404, 'Not Found');
      return res.status(200).json({ event_id: updated.event_id, admit_cards_released: updated.admit_cards_released, message: 'Admit cards published' });
    } catch (err) {
      return next(err);
    }
  },
  async listRegistrations(req, res, next) {
    try {
      const eventId = Number.parseInt(req.query.event_id, 10);
      if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');
      const rows = await adminRegistrationModel.listRegistrationsByEvent(eventId);
      return res.status(200).json(rows);
    } catch (err) {
      return next(err);
    }
  },
  async confirmPayment(req, res, next) {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return next(makeError(400, 'Invalid id'));

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const reg = await adminRegistrationModel.getRegistrationWithEvent(id, client);
      if (!reg) throw makeError(404, 'Not Found');

      const student = await adminRegistrationModel.getStudentById(reg.student_id, client);
      if (!student) throw makeError(404, 'Not Found');

      // Lock row
      const { rows: lockRows } = await client.query(
        `SELECT * FROM registrations WHERE registration_id = $1 FOR UPDATE`,
        [id],
      );
      const locked = lockRows[0];
      if (!locked) throw makeError(404, 'Not Found');
      if (locked.payment_status !== 'CONFIRMED') {
        const event = await eventModel.getEventById(locked.event_id);
        const fee = Number(locked.fee_locked || 0) > 0
          ? Number(locked.fee_locked)
          : getRegistrationStatusAndFee(event, { isGrace: locked.is_grace }).fee;

        const payment_reference = `cash_${Date.now()}`;

        await client.query(
          `UPDATE registrations
           SET payment_status = 'CONFIRMED',
               fee_locked = $2,
               fee_paid = $2,
               payment_reference = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE registration_id = $1`,
          [id, fee, payment_reference],
        );

        if (reg.event_type === EVENT_TYPE.REGULAR) {
          await client.query(
            `INSERT INTO registration_subjects (registration_id, subject_id)
             SELECT $1, subject_id
             FROM subjects
             WHERE program_code = $2
               AND semester     = $3
               AND type         = 'THEORY'
             ON CONFLICT DO NOTHING`,
            [id, student.program_code, student.semester],
          );
        } else if (reg.event_type === EVENT_TYPE.ARREAR) {
          const subjectIds = parseJsonbArray(locked.arrear_subject_ids);
          if (!subjectIds || subjectIds.length === 0) throw makeError(400, 'No arrear subjects selected for this registration');

          const valid = await subjectModel.validateTheorySubjectsInProgram(subjectIds, student.program_code, client);
          if (valid.length !== subjectIds.length) throw makeError(400, 'Invalid arrear subject selection');

          const { rows: backlogRows } = await client.query(
            `SELECT subject_id
             FROM student_backlogs
             WHERE student_id = $1
               AND status = 'PENDING'
               AND subject_id = ANY($2::int[])`,
            [student.student_id, subjectIds],
          );
          if (backlogRows.length !== subjectIds.length) throw makeError(403, 'You do not have an active backlog for one or more of the selected subjects');

          await client.query(
            `INSERT INTO registration_subjects (registration_id, subject_id)
             SELECT $1, unnest($2::int[])
             ON CONFLICT DO NOTHING`,
            [id, subjectIds],
          );
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({ registration_id: id, payment_status: 'CONFIRMED' });
    } catch (err) {
      await client.query('ROLLBACK');
      return next(err);
    } finally {
      client.release();
    }
  },
  async graceRegistration(req, res, next) {
    try {
      const { student_id, event_id, subject_ids } = req.body || {};
      const studentId = Number.parseInt(student_id, 10);
      const eventId = Number.parseInt(event_id, 10);
      if (!Number.isInteger(studentId) || !Number.isInteger(eventId)) throw makeError(400, 'student_id and event_id are required');

      const event = await eventModel.getEventById(eventId);
      if (!event) throw makeError(404, 'Not Found');

      let arrearSubjects = null;
      if (event.event_type === EVENT_TYPE.ARREAR) {
        if (!Array.isArray(subject_ids) || subject_ids.length === 0) throw makeError(400, 'subject_ids is required for ARREAR events');
        const ids = subject_ids.map((x) => Number(x)).filter((n) => Number.isInteger(n));
        if (ids.length === 0) throw makeError(400, 'subject_ids is required for ARREAR events');
        arrearSubjects = ids;
      }

      const { rows: stuRows } = await db.query(
        `SELECT student_id FROM students WHERE student_id = $1 LIMIT 1`,
        [studentId],
      );
      if (stuRows.length === 0) throw makeError(404, 'Not Found');

      const { rows } = await db.query(
        `INSERT INTO registrations (student_id, event_id, payment_status, arrear_subject_ids, is_grace, fee_locked)
         VALUES ($1,$2,'INITIATED',$3,TRUE,$4)
         ON CONFLICT (student_id, event_id) DO UPDATE
         SET is_grace = TRUE,
             arrear_subject_ids = COALESCE(EXCLUDED.arrear_subject_ids, registrations.arrear_subject_ids),
             updated_at = CURRENT_TIMESTAMP
         RETURNING registration_id, is_grace, payment_status`,
        [studentId, eventId, arrearSubjects, Number(event.base_fee)],
      );

      return res.status(201).json({
        registration_id: rows[0].registration_id,
        is_grace: rows[0].is_grace,
        payment_status: rows[0].payment_status,
        message: 'Grace registration created. Student must complete payment.',
      });
    } catch (err) {
      return next(err);
    }
  },
  async createSchedule(req, res, next) {
    try {
      const entry = req.body || {};
      const required = ['event_id', 'subject_id', 'exam_date', 'start_time', 'end_time', 'session'];
      for (const k of required) if (!entry[k]) throw makeError(400, `${k} is required`);
      const created = await scheduleModel.createScheduleEntry(entry);
      return res.status(201).json({ schedule_id: created.schedule_id, message: 'Schedule entry created' });
    } catch (err) {
      return next(err);
    }
  },
  async updateSchedule(req, res, next) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) throw makeError(400, 'Invalid id');
      const updated = await scheduleModel.updateScheduleEntry(id, req.body || {});
      if (!updated) throw makeError(404, 'Not Found');
      return res.status(200).json({ schedule_id: updated.schedule_id, message: 'Schedule entry updated' });
    } catch (err) {
      return next(err);
    }
  },
  async listSchedule(req, res, next) {
    try {
      const eventId = Number.parseInt(req.query.event_id, 10);
      if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');
      const rows = await scheduleModel.listScheduleByEvent(eventId);
      return res.status(200).json(rows);
    } catch (err) {
      return next(err);
    }
  },
  async cloneSchedule(req, res, next) {
    try {
      const { source_event_id, target_event_id } = req.body || {};
      const src = Number.parseInt(source_event_id, 10);
      const tgt = Number.parseInt(target_event_id, 10);
      if (!Number.isInteger(src) || !Number.isInteger(tgt)) throw makeError(400, 'source_event_id and target_event_id are required');
      const result = await scheduleModel.cloneSchedule(src, tgt);
      return res.status(200).json({ cloned: result.cloned, skipped: result.skipped, message: 'Schedule cloned successfully' });
    } catch (err) {
      return next(err);
    }
  },
  async dashboardSummary(req, res, next) {
    try {
      const [totalStudentsRes, totalEventsRes, activeRegsRes, pendingPayRes, recentRegsRes, adminRes] = await Promise.all([
        db.query(`SELECT COUNT(*)::int AS cnt FROM students WHERE status = 'ACTIVE'`),
        db.query(`SELECT COUNT(*)::int AS cnt FROM exam_events WHERE is_cancelled = FALSE`),
        db.query(`SELECT COUNT(*)::int AS cnt FROM registrations WHERE payment_status = 'CONFIRMED'`),
        db.query(`SELECT COUNT(*)::int AS cnt FROM registrations WHERE payment_status IN ('INITIATED','FAILED')`),
        db.query(
          `SELECT r.registration_id, s.name AS student_name, s.reg_no,
                  CONCAT(e.program_code, ' Sem ', e.semester, ' ', e.event_type) AS event_name,
                  r.payment_status, r.created_at
           FROM registrations r
           JOIN students s ON r.student_id = s.student_id
           JOIN exam_events e ON r.event_id = e.event_id
           ORDER BY r.created_at DESC LIMIT 10`
        ),
        db.query(`SELECT name FROM users WHERE user_id = $1 LIMIT 1`, [req.user.user_id]),
      ]);

      const recentRegistrations = recentRegsRes.rows;

      // Build activity timeline from recent registrations
      const activities = recentRegistrations.slice(0, 5).map((r) => ({
        id: r.registration_id,
        title: `${r.student_name} registered`,
        subtitle: r.event_name,
        status: r.payment_status,
        time: r.created_at,
      }));

      return res.status(200).json({
        name: adminRes.rows[0]?.name || null,
        stats: {
          totalStudents: totalStudentsRes.rows[0].cnt,
          totalEvents: totalEventsRes.rows[0].cnt,
          activeRegistrations: activeRegsRes.rows[0].cnt,
          pendingPayments: pendingPayRes.rows[0].cnt,
        },
        recentRegistrations,
        activities,
      });
    } catch (err) {
      return next(err);
    }
  },
  async generateAdmit(req, res, next) {
    try {
      const { event_id } = req.body || {};
      const eventId = Number.parseInt(event_id, 10);
      if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');

      const event = await eventModel.getEventById(eventId);
      if (!event) throw makeError(404, 'Not Found');

      const counts = await adminReportModel.preflightCounts(eventId);
      if (counts.confirmed === 0) throw makeError(400, 'No confirmed registrations found');

      const warnings = [];
      if (counts.attendance === 0) warnings.push('Attendance not yet uploaded');
      if (counts.schedule === 0) warnings.push('Schedule not yet created');

      const scheduleRows = await adminReportModel.scheduleByEvent(eventId);
      const scheduleBySubjectId = new Map(scheduleRows.map((r) => [r.subject_id, r]));

      const regs = await adminReportModel.listConfirmedRegistrationsWithStudent(eventId);
      const minimumAttendance = Number(event.minimum_attendance);

      let success = 0;
      const failedRegNos = [];

      for (const r of regs) {
        try {
          if (!r.profile_photo_url) {
            failedRegNos.push(r.reg_no);
            continue;
          }
          const snapshot = await adminReportModel.registrationSnapshotWithAttendance({
            registrationId: r.registration_id,
            studentId: r.student_id,
            eventId,
          });

          const subjects = snapshot.map((s) => {
            const pct = s.attendance_percentage === null ? null : Number(s.attendance_percentage);
            const eligible = pct !== null && pct >= minimumAttendance;
            return {
              subject_id: s.subject_id,
              subject_code: s.subject_code,
              subject_name: s.subject_name,
              eligibility: eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
            };
          });

          const eligibleCount = subjects.filter((s) => s.eligibility === 'ELIGIBLE').length;
          if (eligibleCount === 0) {
            failedRegNos.push(r.reg_no);
            continue;
          }

          // honors/minors schedule conditional display
          const allowedSubjectIds = subjects.map((s) => s.subject_id);
          const filteredSchedule = new Map();
          for (const [sid, sch] of scheduleBySubjectId.entries()) {
            if (sch.is_honors === false || allowedSubjectIds.includes(sid)) filteredSchedule.set(sid, sch);
          }

          // Generate and discard buffer (not stored permanently)
          await generateAdmitCardBuffer({
            student: r,
            event,
            subjects,
            scheduleBySubjectId: filteredSchedule,
            minimumAttendance,
          });

          success += 1;
        } catch (_e) {
          failedRegNos.push(r.reg_no);
        }
      }

      return res.status(200).json({
        success,
        failed: failedRegNos.length,
        failedRegNos,
        warnings,
      });
    } catch (err) {
      return next(err);
    }
  },
  async reports(req, res, next) {
    try {
      const eventId = Number.parseInt(req.query.event_id, 10);
      const format = String(req.query.format || '').toLowerCase();
      if (!Number.isInteger(eventId)) throw makeError(400, 'event_id is required');
      if (format !== 'csv' && format !== 'pdf') throw makeError(400, 'format must be csv or pdf');

      const event = await eventModel.getEventById(eventId);
      if (!event) throw makeError(404, 'Not Found');

      const { rows: paymentRows } = await db.query(
        `SELECT payment_status, COUNT(*)::int AS cnt
         FROM registrations
         WHERE event_id = $1
         GROUP BY payment_status`,
        [eventId],
      );
      const payment = { INITIATED: 0, CONFIRMED: 0, FAILED: 0 };
      paymentRows.forEach((r) => { payment[r.payment_status] = r.cnt; });
      const total = payment.INITIATED + payment.CONFIRMED + payment.FAILED;

      // Eligibility summary per subject among confirmed registrations (best-effort)
      const minAtt = Number(event.minimum_attendance);
      const { rows: subjSummary } = await db.query(
        `SELECT s.subject_code,
                s.subject_name,
                SUM(CASE WHEN COALESCE(a.attendance_percentage, 0) >= $2 THEN 1 ELSE 0 END)::int AS eligible_count,
                SUM(CASE WHEN COALESCE(a.attendance_percentage, 0) <  $2 THEN 1 ELSE 0 END)::int AS not_eligible_count
         FROM registrations r
         JOIN registration_subjects rs ON rs.registration_id = r.registration_id
         JOIN subjects s ON s.subject_id = rs.subject_id
         LEFT JOIN attendance a
           ON a.student_id = r.student_id
          AND a.subject_id = rs.subject_id
          AND a.event_id = r.event_id
         WHERE r.event_id = $1
           AND r.payment_status = 'CONFIRMED'
         GROUP BY s.subject_code, s.subject_name
         ORDER BY s.subject_code`,
        [eventId, minAtt],
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=\"report_event_${eventId}.csv\"`);
        const lines = [];
        lines.push(`event_id,program_code,semester,academic_year,event_type,total_registrations`);
        lines.push(`${event.event_id},${event.program_code},${event.semester},${event.academic_year},${event.event_type},${total}`);
        lines.push('');
        lines.push('payment_status,count');
        lines.push(`INITIATED,${payment.INITIATED}`);
        lines.push(`CONFIRMED,${payment.CONFIRMED}`);
        lines.push(`FAILED,${payment.FAILED}`);
        lines.push('');
        lines.push(`eligibility_threshold,${minAtt}`);
        lines.push('subject_code,subject_name,eligible_count,not_eligible_count');
        subjSummary.forEach((s) => {
          lines.push(`${s.subject_code},\"${String(s.subject_name).replaceAll('\"', '\"\"')}\",${s.eligible_count},${s.not_eligible_count}`);
        });
        return res.status(200).send(lines.join('\n'));
      }

      // PDF
      const PDFDocument = require('pdfkit');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=\"report_event_${eventId}.pdf\"`);
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      doc.pipe(res);

      doc.fontSize(16).text('Event Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11);
      doc.text(`Event: ${event.program_code} Sem ${event.semester} — ${event.event_type} — ${event.academic_year}`);
      doc.text(`Total registrations: ${total}`);
      doc.moveDown();
      doc.text('Payment breakdown:');
      doc.text(`INITIATED: ${payment.INITIATED}`);
      doc.text(`CONFIRMED: ${payment.CONFIRMED}`);
      doc.text(`FAILED: ${payment.FAILED}`);
      doc.moveDown();
      doc.text(`Eligibility threshold: ${minAtt}%`);
      doc.moveDown();
      doc.text('Eligibility summary per subject:');
      subjSummary.forEach((s) => {
        doc.fontSize(10).text(`${s.subject_code} — ${s.subject_name}: eligible ${s.eligible_count}, not eligible ${s.not_eligible_count}`);
      });
      doc.end();
      return undefined;
    } catch (err) {
      return next(err);
    }
  },
};

