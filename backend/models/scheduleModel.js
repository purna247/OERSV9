const db = require('../config/db');

async function createScheduleEntry(entry) {
  const { rows } = await db.query(
    `INSERT INTO exam_schedule (event_id, subject_id, exam_date, start_time, end_time, session, is_honors)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING schedule_id`,
    [
      entry.event_id,
      entry.subject_id,
      entry.exam_date,
      entry.start_time,
      entry.end_time,
      entry.session,
      entry.is_honors === true,
    ],
  );
  return rows[0];
}

async function updateScheduleEntry(scheduleId, fields) {
  const { exam_date, start_time, end_time, session, is_honors } = fields;
  const { rows } = await db.query(
    `UPDATE exam_schedule
     SET exam_date = $2,
         start_time = $3,
         end_time = $4,
         session = $5,
         is_honors = $6
     WHERE schedule_id = $1
     RETURNING schedule_id`,
    [scheduleId, exam_date, start_time, end_time, session, is_honors === true],
  );
  return rows[0] || null;
}

async function listScheduleByEvent(eventId) {
  const { rows } = await db.query(
    `SELECT es.schedule_id,
            es.subject_id,
            s.subject_code,
            s.subject_name,
            to_char(es.exam_date, 'YYYY-MM-DD') AS exam_date,
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
  return rows;
}

async function cloneSchedule(sourceEventId, targetEventId) {
  const { rows: targetRows } = await db.query(
    `SELECT program_code, semester
     FROM exam_events
     WHERE event_id = $1
     LIMIT 1`,
    [targetEventId],
  );
  const target = targetRows[0];
  if (!target) return { cloned: 0, skipped: 0 };

  const { rowCount } = await db.query(
    `INSERT INTO exam_schedule (event_id, subject_id, exam_date, start_time, end_time, session, is_honors)
     SELECT $1, tgt.subject_id, src.exam_date, src.start_time, src.end_time, src.session, src.is_honors
     FROM exam_schedule src
     JOIN subjects s ON src.subject_id = s.subject_id
     JOIN subjects tgt ON tgt.subject_code = s.subject_code
       AND tgt.program_code = $2
       AND tgt.semester = $3
     WHERE src.event_id = $4
     ON CONFLICT DO NOTHING`,
    [targetEventId, target.program_code, target.semester, sourceEventId],
  );

  // best-effort skipped: total source rows that matched target subject mapping minus inserted rows
  const { rows: possibleRows } = await db.query(
    `SELECT COUNT(*)::int AS cnt
     FROM exam_schedule src
     JOIN subjects s ON src.subject_id = s.subject_id
     JOIN subjects tgt ON tgt.subject_code = s.subject_code
       AND tgt.program_code = $1
       AND tgt.semester = $2
     WHERE src.event_id = $3`,
    [target.program_code, target.semester, sourceEventId],
  );
  const possible = possibleRows[0]?.cnt ?? 0;

  return { cloned: rowCount, skipped: Math.max(0, possible - rowCount) };
}

module.exports = {
  createScheduleEntry,
  updateScheduleEntry,
  listScheduleByEvent,
  cloneSchedule,
};

