const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const RedisClient = require('../utils/redis');  // Adjust the path as necessary

chai.use(sinonChai);
const { expect } = chai;

describe('RedisClient', function() {
    let redisClient;
    let redisMock;

    beforeEach(function() {
        // Create a new instance of RedisClient
        redisClient = new RedisClient();

        // Create a sinon sandbox to isolate stubs and mocks
        redisMock = sinon.createSandbox();

        // Mock redis client methods
        redisClient.client = {
            connected: true,
            get: redisMock.stub(),
            set: redisMock.stub(),
            del: redisMock.stub(),
            on: redisMock.stub(),
        };
        redisClient.getAsync = redisMock.stub();
        redisClient.setAsync = redisMock.stub();
        redisClient.delAsync = redisMock.stub();
    });

    afterEach(function() {
        // Restore original methods
        redisMock.restore();
    });

    describe('isAlive', function() {
        it('should return true if the Redis client is connected', function() {
            expect(redisClient.isAlive()).to.be.true;
        });
    });

    describe('get', function() {
        it('should return the value from redis when the key exists', async function() {
            const key = 'testKey';
            const value = 'testValue';
            redisClient.getAsync.withArgs(key).resolves(value);

            const result = await redisClient.get(key);
            expect(result).to.equal(value);
            expect(redisClient.getAsync).to.have.been.calledOnceWith(key);
        });

        it('should handle errors when getting a key', async function() {
            const key = 'testKey';
            const error = new Error('Redis error');
            redisClient.getAsync.withArgs(key).rejects(error);

            await expect(redisClient.get(key)).to.be.rejectedWith(error);
            expect(redisClient.getAsync).to.have.been.calledOnceWith(key);
        });
    });

    describe('set', function() {
        it('should set a value in redis', async function() {
            const key = 'testKey';
            const value = 'testValue';
            const duration = 3600;
            redisClient.setAsync.withArgs(key, value, 'EX', duration).resolves();

            await redisClient.set(key, value, duration);
            expect(redisClient.setAsync).to.have.been.calledOnceWith(key, value, 'EX', duration);
        });

        it('should handle errors when setting a value', async function() {
            const key = 'testKey';
            const value = 'testValue';
            const duration = 3600;
            const error = new Error('Redis error');
            redisClient.setAsync.withArgs(key, value, 'EX', duration).rejects(error);

            await expect(redisClient.set(key, value, duration)).to.be.rejectedWith(error);
            expect(redisClient.setAsync).to.have.been.calledOnceWith(key, value, 'EX', duration);
        });
    });

    describe('del', function() {
        it('should delete a key from redis', async function() {
            const key = 'testKey';
            redisClient.delAsync.withArgs(key).resolves();

            await redisClient.del(key);
            expect(redisClient.delAsync).to.have.been.calledOnceWith(key);
        });

        it('should handle errors when deleting a key', async function() {
            const key = 'testKey';
            const error = new Error('Redis error');
            redisClient.delAsync.withArgs(key).rejects(error);

            await expect(redisClient.del(key)).to.be.rejectedWith(error);
            expect(redisClient.delAsync).to.have.been.calledOnceWith(key);
        });
    });
});
