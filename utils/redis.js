#!/usr/bin/node

const { createClient } = require('redis');
const { promisify } = require('util');

class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => console.log(err));
        this.connected = false;
        this.client.on('connect', () => {
            this.connected = true;
        });
    }

    isAlive() {
        return this.connected;
    }

    async get(key) {
       
            const getAsyncVal = promisify(this.client.get).bind(this.client);
            const val = await getAsyncVal(key);
            return val;
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
