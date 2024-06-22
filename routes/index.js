#!/usr/bin/node

const express = require('express');
const router = express.Router();  

// Import your controllers, adjust paths 
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');  

// API endpoints definition
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe); // Adjusted to use UsersController
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/files', FilesController.postUpload); // Add new endpoint
router.put('/files/:id/publish', FilesController.putPublish); // Add new endpoint
router.put('/files/:id/unpublish', FilesController.putUnpublish); // Add new endpoint
router.get('/files/:id/data', FilesController.getFile); // Add new endpoint

module.exports = router;
