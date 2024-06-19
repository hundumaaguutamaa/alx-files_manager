#!/usr/bin/node

const express = require('express');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.status(200).json({ redis: true, db: true });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

class AppController {
  static async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      res.status(200).json({ users, files });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


module.exports = AppController;
