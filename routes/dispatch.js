const express = require('express');
const router = express.Router();
const dispatchController = require('../controller/dispatchController');

router.post('/', dispatchController.handleMoveToRepair);

// Route to get all users
router.get('/', dispatchController.handleGetDispatch);

module.exports = router;