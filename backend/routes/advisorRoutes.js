const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const advisorController = require('../controllers/advisorController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('advisor'));

router.get('/dashboard', advisorController.advisorDashboard);
router.get('/events', advisorController.listAdvisorEvents);
router.post('/upload-attendance/preview', advisorController.upload.single('file'), advisorController.previewAttendance);
router.post('/upload-attendance/confirm', advisorController.upload.single('file'), advisorController.confirmAttendance);
router.get('/students', advisorController.listAdvisorStudents);

module.exports = router;

