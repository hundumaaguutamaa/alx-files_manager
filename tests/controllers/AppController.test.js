import request from 'supertest';
import express from 'express';
import sinon from 'sinon';
import AppController from '../controllers/AppController';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// Create an Express app for testing
const app = express();
app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);

// Mocks
const redisStatusStub = sinon.stub(redisClient, 'isAlive');
const dbStatusStub = sinon.stub(dbClient, 'isAlive');
const dbNbUsersStub = sinon.stub(dbClient, 'nbUsers');
const dbNbFilesStub = sinon.stub(dbClient, 'nbFiles');

describe('AppController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('GET /status', () => {
    it('should return status of Redis and DB', async () => {
      // Arrange
      redisStatusStub.resolves(true);
      dbStatusStub.resolves(true);

      // Act
      const response = await request(app).get('/status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ redis: true, db: true });
    });

    it('should handle errors from Redis or DB', async () => {
      // Arrange
      redisStatusStub.rejects(new Error('Redis error'));
      dbStatusStub.rejects(new Error('DB error'));

      // Act
      const response = await request(app).get('/status');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ redis: false, db: false });
    });
  });

  describe('GET /stats', () => {
    it('should return the number of users and files', async () => {
      // Arrange
      dbNbUsersStub.resolves(100);
      dbNbFilesStub.resolves(200);

      // Act
      const response = await request(app).get('/stats');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ users: 100, files: 200 });
    });

    it('should handle errors from DB methods', async () => {
      // Arrange
      dbNbUsersStub.rejects(new Error('DB error'));
      dbNbFilesStub.rejects(new Error('DB error'));

      // Act
      const response = await request(app).get('/stats');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ users: 'error', files: 'error' });
    });
  });
});
