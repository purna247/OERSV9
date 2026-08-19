const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
const { makeError } = require('../utils/validators');

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      throw makeError(400, 'identifier and password are required');
    }

    const isEmail = String(identifier).includes('@');

    if (isEmail) {
      const user = await userModel.findActiveUserByEmail(String(identifier).trim());
      if (!user) throw makeError(401, 'Invalid credentials');
      if (user.is_active === false) throw makeError(401, 'Invalid credentials');

      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) throw makeError(401, 'Invalid credentials');

      const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
      );
      return res.status(200).json({ token, role: user.role });
    }

    const student = await studentModel.findStudentByRegNo(String(identifier).trim());
    if (!student) throw makeError(401, 'Invalid credentials');
    const ok = await bcrypt.compare(String(password), student.password_hash);
    if (!ok) throw makeError(401, 'Invalid credentials');

    const token = jwt.sign(
      { user_id: student.student_id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    );
    return res.status(200).json({ token, role: 'student' });
  } catch (err) {
    return next(err);
  }
}

async function logout(_req, res) {
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      throw makeError(400, 'current_password and new_password are required');
    }
    if (String(new_password).length < 6) {
      throw makeError(400, 'New password must be at least 6 characters');
    }

    const { user_id, role } = req.user;
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

    if (role === 'student') {
      const student = await studentModel.findStudentById(user_id);
      if (!student) throw makeError(404, 'Not found');
      const ok = await bcrypt.compare(String(current_password), student.password_hash);
      if (!ok) throw makeError(401, 'Current password is incorrect');
      const hash = await bcrypt.hash(String(new_password), rounds);
      await studentModel.updatePassword(user_id, hash);
    } else {
      const user = await userModel.findUserById(user_id);
      if (!user) throw makeError(404, 'Not found');
      const ok = await bcrypt.compare(String(current_password), user.password_hash);
      if (!ok) throw makeError(401, 'Current password is incorrect');
      const hash = await bcrypt.hash(String(new_password), rounds);
      await userModel.updatePassword(user_id, hash);
    }

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, changePassword };

