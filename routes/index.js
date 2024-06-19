#!/usr/bin/node

const express = require('express');
const router = express.Router(); // Initialize the router

// Import your controllers (adjust paths as needed)
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

// Define your API endpoints
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', AuthController.getMe);
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router;
