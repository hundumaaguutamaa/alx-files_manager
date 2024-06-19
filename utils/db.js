#!/usr/bin/node


// Importing mongodb package to access all components

const { MongoClient } = require('mongodb');
const mongo = require('mongodb');
const { pwdHashed } = require('./utils');

class DBClient {
  constructor() {
	const host = process.env.DB_HOST || 'localhost';
	const port = process.env.DB_PORT || 27017;
	const database = process.env.DB_DATABASE || 'files_manager';

isAlive() {
    return this.connected;
  }
