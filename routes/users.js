const express = require('express');
const router = express.Router();
const usersController = require('../controller/usersController');

// Route to create a new user
router.post('/', usersController.handleNewUser);

// Route to delete a user by ID
router.delete('/:userId', usersController.handleDeleteUser);

// Route to get all users
router.get('/', usersController.handleGetUsers);

module.exports = router;