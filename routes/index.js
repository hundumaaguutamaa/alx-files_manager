#!/usr/bin/node

const express = require('express');
const router = express.Router(); // Initializing the router

// Import your controllers, adjust paths 
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

// API endpoints definition
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe); // Adjusted to use UsersController
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router;
