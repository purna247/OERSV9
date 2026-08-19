const { makeError } = require('../utils/validators');

function getRegistrationStatusAndFee(event, { isGrace = false } = {}) {
  const today = new Date();
  const regEnd = new Date(event.registration_end);
  const lateEnd = new Date(event.late_fee_end);

  const toMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const t = toMidnight(today);
  const re = toMidnight(regEnd);
  const le = toMidnight(lateEnd);

  if (isGrace) {
    return { fee: Number(event.base_fee), status: 'OPEN' };
  }

  if (t <= re) return { fee: Number(event.base_fee), status: 'OPEN' };
  if (t > re && t <= le) return { fee: Number(event.base_fee) + Number(event.late_fee), status: 'OPEN_LATE' };

  throw makeError(400, 'Registration window closed');
}

module.exports = { getRegistrationStatusAndFee };

