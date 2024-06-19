#!/usr/bin/node

const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log(err));
    this.connected = false;
    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Redis client is not connected'));
        return;
      }

      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}


    async set(key, val, dur) {
        try {
            await this.client.setEx(key, dur, val);
            console.log(`Key ${key} set with value ${val} for ${dur} seconds`);
        } catch (err) {
            console.error('Error setting key:', err);
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            console.log(`Key ${key} deleted`);
        } catch (err) {
            console.error('Error deleting key:', err);
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;

