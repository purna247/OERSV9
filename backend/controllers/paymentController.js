const crypto = require('crypto');

const db = require('../config/db');
const registrationModel = require('../models/registrationModel');
const eventModel = require('../models/eventModel');
const subjectModel = require('../models/subjectModel');
const studentProfileModel = require('../models/studentProfileModel');
const { EVENT_TYPE } = require('../constants/enums');
const { getRegistrationStatusAndFee } = require('../services/feeService');
const { parseJsonbArray } = require('../services/jsonb');
const { makeError } = require('../utils/validators');

async function createOrder(req, res, next) {
  try {
    const { registration_id } = req.body || {};
    if (!registration_id) throw makeError(400, 'registration_id is required');

    // Ensure registration belongs to current student
    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const reg = await db.query(
      `SELECT r.*
       FROM registrations r
       WHERE r.registration_id = $1
       LIMIT 1`,
      [registration_id],
    );
    const registration = reg.rows[0];
    if (!registration) throw makeError(404, 'Not Found');
    if (registration.student_id !== student.student_id) throw makeError(403, 'Forbidden');

    const event = await eventModel.getEventById(registration.event_id);
    if (!event) throw makeError(404, 'Not Found');

    const payment_order_id = `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { fee } = getRegistrationStatusAndFee(event, { isGrace: registration.is_grace });

    await db.query(
      `UPDATE registrations
       SET payment_order_id = $2,
           fee_locked = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE registration_id = $1`,
      [registration.registration_id, payment_order_id, fee],
    );

    return res.status(200).json({ order_id: payment_order_id, amount: fee, currency: 'INR' });
  } catch (err) {
    return next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { registration_id, order_id, action } = req.body || {};
    if (!registration_id || !order_id || !action) throw makeError(400, 'registration_id, order_id and action are required');
    if (action !== 'success' && action !== 'failure') throw makeError(400, 'Invalid action');

    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const regRes = await db.query(
      `SELECT r.*
       FROM registrations r
       WHERE r.registration_id = $1
       LIMIT 1`,
      [registration_id],
    );
    const registration = regRes.rows[0];
    if (!registration) throw makeError(404, 'Not Found');
    if (registration.student_id !== student.student_id) throw makeError(403, 'Forbidden');
    if (registration.payment_order_id !== order_id) throw makeError(400, 'Invalid order_id');

    if (action === 'failure') {
      await db.query(
        `UPDATE registrations
         SET payment_status = 'FAILED',
             updated_at = CURRENT_TIMESTAMP
         WHERE registration_id = $1`,
        [registration.registration_id],
      );
      return res.status(200).json({ status: 'FAILED' });
    }

    const event = await eventModel.getEventById(registration.event_id);
    if (!event) throw makeError(404, 'Not Found');

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Lock row to prevent double-confirm
      const { rows: lockedRows } = await client.query(
        `SELECT *
         FROM registrations
         WHERE registration_id = $1
         FOR UPDATE`,
        [registration.registration_id],
      );
      const locked = lockedRows[0];
      if (!locked) throw makeError(404, 'Not Found');
      if (locked.payment_status === 'CONFIRMED') {
        await client.query('COMMIT');
        return res.status(200).json({ status: 'CONFIRMED', payment_reference: locked.payment_reference });
      }

      const feePaid = Number(locked.fee_locked || 0);
      if (feePaid <= 0) {
        throw makeError(400, 'Payment not initialized. Please create order first.');
      }

      const payment_reference = `mock_ref_${crypto.randomBytes(6).toString('hex')}`;

      await client.query(
        `UPDATE registrations
         SET payment_status = 'CONFIRMED',
             fee_paid = $2,
             payment_reference = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE registration_id = $1`,
        [locked.registration_id, feePaid, payment_reference],
      );

      if (event.event_type === EVENT_TYPE.REGULAR) {
        await client.query(
          `INSERT INTO registration_subjects (registration_id, subject_id)
           SELECT $1, subject_id
           FROM subjects
           WHERE program_code = $2
             AND semester     = $3
             AND type         = 'THEORY'
           ON CONFLICT DO NOTHING`,
          [locked.registration_id, student.program_code, student.semester],
        );
      } else if (event.event_type === EVENT_TYPE.ARREAR) {
        const subjectIds = parseJsonbArray(locked.arrear_subject_ids);
        if (!subjectIds || subjectIds.length === 0) {
          throw makeError(400, 'No arrear subjects selected for this registration');
        }

        const valid = await subjectModel.validateTheorySubjectsInProgram(subjectIds, student.program_code, client);
        if (valid.length !== subjectIds.length) {
          throw makeError(400, 'Invalid arrear subject selection');
        }

        const { rows: backlogRows } = await client.query(
          `SELECT subject_id
           FROM student_backlogs
           WHERE student_id = $1
             AND status = 'PENDING'
             AND subject_id = ANY($2::int[])`,
          [student.student_id, subjectIds],
        );
        if (backlogRows.length !== subjectIds.length) {
          throw makeError(403, 'You do not have an active backlog for one or more of the selected subjects');
        }

        await client.query(
          `INSERT INTO registration_subjects (registration_id, subject_id)
           SELECT $1, unnest($2::int[])
           ON CONFLICT DO NOTHING`,
          [locked.registration_id, subjectIds],
        );
      }

      await client.query('COMMIT');
      return res.status(200).json({ status: 'CONFIRMED', payment_reference });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return next(err);
  }
}

async function status(req, res, next) {
  try {
    const registrationId = Number.parseInt(req.params.registration_id, 10);
    if (!Number.isInteger(registrationId)) throw makeError(400, 'Invalid registration_id');

    const student = await studentProfileModel.getStudentById(req.user.user_id);
    if (!student) throw makeError(404, 'Not Found');

    const { rows } = await db.query(
      `SELECT registration_id, student_id, payment_status, payment_order_id
       FROM registrations
       WHERE registration_id = $1
       LIMIT 1`,
      [registrationId],
    );
    const row = rows[0];
    if (!row) throw makeError(404, 'Not Found');
    if (row.student_id !== student.student_id) throw makeError(403, 'Forbidden');

    return res.status(200).json({
      registration_id: row.registration_id,
      payment_status: row.payment_status,
      payment_order_id: row.payment_order_id,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createOrder,
  verify,
  status,
};

