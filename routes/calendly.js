const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const calendlyController = require('../controllers/calendlyController');

router.use(authenticateToken);

router.get('/availability/:teacherId', calendlyController.getTeacherAvailability);
router.post('/book', calendlyController.createBooking);

module.exports = router;

