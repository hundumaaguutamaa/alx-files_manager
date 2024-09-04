const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        // Handle redis client errors
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        // Promisify get, set, and del to use them with async/await
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        try {
            const value = await this.getAsync(key);
            return value;
        } catch (err) {
            console.error(`Failed to get key ${key}:`, err);
            return null;
        }
    }

    async set(key, value, duration) {
        try {
            await this.setAsync(key, value, 'EX', duration);
        } catch (err) {
            console.error(`Failed to set key ${key} with value ${value}:`, err);
        }
    }

    async del(key) {
        try {
            await this.delAsync(key);
        } catch (err) {
            console.error(`Failed to delete key ${key}:`, err);
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;

