#!/usr/bin/node

const { MongoClient } = require('mongodb');
const mongo = require('mongodb');
const { pwdHashed } = require('./utils');


// Reads environment variables for the MongoDB host, port, and database name and set defaults
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const dbUrl = `mongodb://${host}:${port}`;
    this.connected = false;
    this.client = new MongoClient(dbUrl, { useUnifiedTopology: true });
    this.client.connect().then(() => {
      this.connected = true;
    }).catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.connected;
  }

  // Function retrieves the total number of documents (records) in the MongoDB collection named “users.”
  async nbUsers() {
    await this.client.connect();
    const users = await this.client.db(this.database).collection('users').countDocuments();
    return users;
  }

  async nbFiles() {
    await this.client.connect();
    const files = await this.client.db(this.database).collection('files').countDocuments();
    return files;
  }
}

// Export an instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
