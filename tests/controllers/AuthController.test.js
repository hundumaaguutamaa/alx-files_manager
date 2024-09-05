import request from 'supertest';
import express from 'express';
import sinon from 'sinon';
import AuthController from '../controllers/AuthController';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

// Create an Express app for testing
const app = express();
app.use(express.json());
app.post('/connect', AuthController.getConnect);
app.delete('/disconnect', AuthController.getDisconnect);

// Mocks
const redisSetStub = sinon.stub(redisClient, 'set');
const redisGetStub = sinon.stub(redisClient, 'get');
const redisDelStub = sinon.stub(redisClient, 'del');
const dbFindOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne');

describe('AuthController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /connect', () => {
    it('should return a token if credentials are valid', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'password';
      const hashedPassword = sha1(password);
      const userId = 'user123';
      const token = uuidv4();

      dbFindOneStub.resolves({ _id: userId });
      redisSetStub.resolves();

      const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;

      // Act
      const response = await request(app)
        .post('/connect')
        .set('Authorization', authHeader);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(redisSetStub.calledOnce).toBe(true);
    });

    it('should return 401 if credentials are invalid', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'wrongpassword';
      const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;

      dbFindOneStub.resolves(null);

      // Act
      const response = await request(app)
        .post('/connect')
        .set('Authorization', authHeader);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if authorization header is missing', async () => {
      // Act
      const response = await request(app)
        .post('/connect');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('DELETE /disconnect', () => {
    it('should successfully disconnect if token is valid', async () => {
      // Arrange
      const token = uuidv4();
      const userId = 'user123';

      redisGetStub.resolves(userId);
      redisDelStub.resolves();

      // Act
      const response = await request(app)
        .delete('/disconnect')
        .set('x-token', token);

      // Assert
      expect(response.status).toBe(204);
      expect(redisDelStub.calledOnce).toBe(true);
    });

    it('should return 401 if token is not provided', async () => {
      // Act
      const response = await request(app)
        .delete('/disconnect');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      const token = uuidv4();
      redisGetStub.resolves(null);

      // Act
      const response = await request(app)
        .delete('/disconnect')
        .set('x-token', token);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });
});
