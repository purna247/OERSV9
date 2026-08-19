const PAYMENT_STATUS = Object.freeze({
  INITIATED: 'INITIATED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
});

const EVENT_TYPE = Object.freeze({
  REGULAR: 'REGULAR',
  ARREAR: 'ARREAR',
});

const STUDENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  DETAINED: 'DETAINED',
  GRADUATED: 'GRADUATED',
});

const SESSION = Object.freeze({
  MORNING: 'MORNING',
  EVENING: 'EVENING',
});

const ROLE = Object.freeze({
  STUDENT: 'student',
  ADMIN: 'admin',
  ADVISOR: 'advisor',
});

module.exports = {
  PAYMENT_STATUS,
  EVENT_TYPE,
  STUDENT_STATUS,
  SESSION,
  ROLE,
};

