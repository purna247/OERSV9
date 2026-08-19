const db = require('../config/db');

async function listEvents() {
  const { rows } = await db.query(
    `SELECT event_id, program_code, semester, academic_year, event_type,
            registration_start, registration_end, late_fee_end,
            base_fee, late_fee, minimum_cgpa, minimum_attendance,
            is_cancelled, admit_cards_released
     FROM exam_events
     ORDER BY registration_start DESC, event_id DESC`,
  );
  return rows;
}

async function createEventsBulk(payload) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let created = 0;
    const skippedDetails = [];

    for (const program_code of payload.programs) {
      for (const semester of payload.semesters) {
        const { rowCount } = await client.query(
          `INSERT INTO exam_events (
              program_code, semester, academic_year,
              registration_start, registration_end, late_fee_end,
              exam_start, exam_end, base_fee, late_fee,
              event_type, minimum_cgpa, minimum_attendance
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT (program_code, semester, event_type, academic_year) DO NOTHING`,
          [
            program_code,
            semester,
            payload.academic_year,
            payload.registration_start,
            payload.registration_end,
            payload.late_fee_end,
            payload.exam_start,
            payload.exam_end,
            payload.base_fee,
            payload.late_fee,
            payload.event_type,
            payload.minimum_cgpa,
            payload.minimum_attendance,
          ],
        );
        if (rowCount === 1) created += 1;
        else skippedDetails.push({ program_code, semester, reason: 'Duplicate event exists' });
      }
    }

    await client.query('COMMIT');
    return { created, skipped: skippedDetails.length, skippedDetails };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function deleteOrCancelEvent(eventId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: regRows } = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM registrations WHERE event_id = $1`,
      [eventId],
    );
    const cnt = regRows[0]?.cnt ?? 0;

    if (cnt === 0) {
      await client.query(`DELETE FROM exam_events WHERE event_id = $1`, [eventId]);
      await client.query('COMMIT');
      return { action: 'hard_deleted' };
    }

    const { rows: updRows } = await client.query(
      `UPDATE exam_events
       SET is_cancelled = TRUE
       WHERE event_id = $1
       RETURNING is_cancelled`,
      [eventId],
    );
    await client.query('COMMIT');
    return { action: 'soft_cancelled', is_cancelled: updRows[0]?.is_cancelled === true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function publishAdmitCards(eventId) {
  const { rows } = await db.query(
    `UPDATE exam_events
     SET admit_cards_released = TRUE
     WHERE event_id = $1
     RETURNING event_id, admit_cards_released`,
    [eventId],
  );
  return rows[0] || null;
}

module.exports = {
  listEvents,
  createEventsBulk,
  deleteOrCancelEvent,
  publishAdmitCards,
};

