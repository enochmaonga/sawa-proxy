const express = require('express');
const router = express.Router()
const bookingController = require('../controller/bookingController');

router.post('/',bookingController.handleNewEntry);

// Route to get all users
router.get('/', bookingController.handleGetBooking);

module.exports = router;