import request from 'supertest';
import express from 'express';
import sinon from 'sinon';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import UsersController from '../controllers/UsersController';

// Create an Express app for testing
const app = express();
app.use(express.json());
app.post('/users', UsersController.postNew);
app.get('/me', UsersController.getMe);

// Mocks
const dbStub = sinon.stub(dbClient.db.collection('users'), 'insertOne');
const userQueueStub = sinon.stub(Queue.prototype, 'add');
const redisStub = sinon.stub(redisClient, 'get');

describe('UsersController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /users', () => {
    it('should add a job to the userQueue and return 201', async () => {
      // Arrange
      const mockUser = { insertedId: '12345' };
      dbStub.resolves(mockUser);
      userQueueStub.resolves();

      const newUser = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      // Act
      const response = await request(app)
        .post('/users')
        .send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: mockUser.insertedId });
      sinon.assert.calledOnce(userQueueStub);
      sinon.assert.calledWith(userQueueStub, { userId: mockUser.insertedId });
    });

    it('should return 500 if there is an error', async () => {
      // Arrange
      dbStub.rejects(new Error('Database error'));

      const newUser = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      // Act
      const response = await request(app)
        .post('/users')
        .send(newUser);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('GET /me', () => {
    it('should return user details if token is valid', async () => {
      // Arrange
      const mockUser = { _id: '12345', email: 'john.doe@example.com' };
      const token = 'valid-token';
      redisStub.resolves('12345');
      sinon.stub(dbClient.db.collection('users'), 'findOne').resolves(mockUser);

      const response = await request(app)
        .get('/me')
        .set('x-token', token);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: mockUser._id, email: mockUser.email });
    });

    it('should return 401 if token is missing', async () => {
      // Act
      const response = await request(app)
        .get('/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if user is not found', async () => {
      // Arrange
      const token = 'valid-token';
      redisStub.resolves('12345');
      sinon.stub(dbClient.db.collection('users'), 'findOne').resolves(null);

      // Act
      const response = await request(app)
        .get('/me')
        .set('x-token', token);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      const token = 'invalid-token';
      redisStub.resolves(null);

      // Act
      const response = await request(app)
        .get('/me')
        .set('x-token', token);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });
});
