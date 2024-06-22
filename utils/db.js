#!/usr/bin/node

const { MongoClient } = require('mongodb');
const mongo = require('mongodb');
const { pwdHashed } = require('./utils');


// Reads environment variables for the MongoDB host, port, and database name and set defaults
class DBClient {
  constructor() {
    const host = (process.env.DB_HOST) ? process.env.DB_HOST : 'localhost';
    const port = (process.env.DB_PORT) ? process.env.DB_PORT : 27017;
    this.database = (process.env.DB_DATABASE) ? process.env.DB_DATABASE : 'files_manager';
    const dbConUrl = `mongodb://${host}:${port}`;
    this.connected = false;
    this.client = new MongoClient(dbConUrl, { useUnifiedTopology: true });
    this.client.connect().then(() => {
      this.connected = true;
    }).catch((err) => console.log(err.message));
  }

 class DatabaseClient {
  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    await this.mongoClient.connect();
    const userCount = await this.mongoClient.db(this.dbName).collection('users').countDocuments();
    return userCount;
  }

  async nbFiles() {
    await this.mongoClient.connect();
    const fileCount = await this.mongoClient.db(this.dbName).collection('files').countDocuments();
    return fileCount;
  }

  async addUser(email, password) {
    const hashedPassword = hashPassword(password);
    await this.mongoClient.connect();
    const newUser = await this.mongoClient.db(this.dbName).collection('users').insertOne({ email, password: hashedPassword });
    return newUser;
  }

  async findUserByEmail(email) {
    await this.mongoClient.connect();
    const user = await this.mongoClient.db(this.dbName).collection('users').find({ email }).toArray();
    if (!user.length) {
      return null;
    }
    return user[0];
  }

  async findUserById(id) {
    const userId = new mongo.ObjectID(id);
    await this.mongoClient.connect();
    const user = await this.mongoClient.db(this.dbName).collection('users').find({ _id: userId }).toArray();
    if (!user.length) {
      return null;
    }
    return user[0];
  }

  async doesUserExist(email) {
    const user = await this.findUserByEmail(email);
    return !!user;
  }
}

const databaseClient = new DatabaseClient();
module.exports = databaseClient;
