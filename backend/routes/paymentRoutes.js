const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('student'));

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verify);
router.get('/status/:registration_id', paymentController.status);

module.exports = router;

