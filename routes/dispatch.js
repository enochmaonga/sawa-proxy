const express = require('express');
const router = express.Router();
const dispatchController = require('../controller/dispatchController');

router.post('/', dispatchController.handleMoveToRepair);

module.exports = router;