const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Programs
router.post('/programs', adminController.createProgram);
router.get('/programs', adminController.listPrograms);
router.put('/programs/:id', adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

// Subjects
router.get('/subjects', adminController.listSubjects);

// Advisors
router.get('/advisors', adminController.listAdvisors);
router.delete('/advisors/:id', adminController.deactivateAdvisor);
router.put('/advisors/:id/reactivate', adminController.reactivateAdvisor);

// Admin creation
router.post('/create-admin', adminController.createAdmin);

// Uploads
router.post('/upload-students', adminController.upload.single('file'), adminController.uploadStudents);
router.post('/upload-advisors', adminController.upload.single('file'), adminController.uploadAdvisors);
router.post('/upload-subjects', adminController.upload.single('file'), adminController.uploadSubjects);
router.post('/upload-backlogs', adminController.upload.single('file'), adminController.uploadBacklogs);

// Students
router.get('/students', adminController.listStudents);
router.put('/students-cgpa/bulk', adminController.bulkUpdateCgpa);
router.put('/students/:id/status', adminController.updateStudentStatus);
router.post('/students/:id/reset-password', adminController.resetStudentPassword);

// Exam Events
router.post('/events/bulk', adminController.createEventsBulk);
router.get('/events', adminController.listEvents);
router.delete('/events/:id', adminController.deleteEvent);
router.put('/events/:id/publish-admit-cards', adminController.publishAdmitCards);

// Registrations
router.get('/registrations', adminController.listRegistrations);
router.post('/registrations/:id/confirm-payment', adminController.confirmPayment);
router.post('/registrations/manual', adminController.graceRegistration);

// Schedule
router.post('/schedule', adminController.createSchedule);
router.put('/schedule/:id', adminController.updateSchedule);
router.get('/schedule', adminController.listSchedule);
router.post('/schedule/clone', adminController.cloneSchedule);

// Admit cards & reports
router.get('/dashboard-summary', adminController.dashboardSummary);
router.post('/generate-admit', adminController.generateAdmit);
router.get('/reports', adminController.reports);

module.exports = router;

