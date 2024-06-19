#!/usr/bin/node

const { MongoClient } = require('mongodb');
const mongo = require('mongodb');
const { pwdHashed } = require('./utils');

class DBClient {
  constructor() {

  }


	 isAlive() {
    	 	return this.connected;


const dbClient = new DBClient();
module.exports = dbClient;
