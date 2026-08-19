const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('student'));

router.get('/profile', studentController.profile);
router.post('/upload-photo', studentController.photoUpload.single('photo'), studentController.uploadPhoto);
router.get('/events', studentController.listEvents);
router.post('/register', studentController.register);
router.get('/registrations', studentController.listRegistrations);
router.get('/schedule', studentController.schedule);
router.get('/admit-card', studentController.admitCard);
router.get('/admit-card-data', studentController.admitCardData);
router.get('/attendance', studentController.getAttendance);

module.exports = router;

