import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import FilesController from '../controllers/FilesController';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

// Create an Express app for testing
const app = express();
app.use(express.json());
app.post('/upload', FilesController.postUpload);
app.get('/files/:id', FilesController.getShow);
app.get('/files', FilesController.getIndex);
app.put('/files/:id/publish', FilesController.putPublish);
app.put('/files/:id/unpublish', FilesController.putUnpublish);
app.get('/files/:id/content', FilesController.getFile);

// Mocks
const redisGetStub = sinon.stub(redisClient, 'get');
const dbCollectionStub = sinon.stub(dbClient, 'collection');
const fsExistsSyncStub = sinon.stub(fs, 'existsSync');
const fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync');
const fsStatSyncStub = sinon.stub(fs, 'statSync');
const fsReadFileSyncStub = sinon.stub(fs, 'readFileSync');
const pathResolveStub = sinon.stub(path, 'resolve');
const mimeContentTypeStub = sinon.stub(require('mime-types'), 'contentType');

describe('FilesController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /upload', () => {
    it('should upload a file successfully', async () => {
      // Arrange
      const token = 'validToken';
      const userId = 'user123';
      const name = 'file.txt';
      const type = 'file';
      const parentId = 0;
      const isPublic = false;
      const data = Buffer.from('test data').toString('base64');

      redisGetStub.resolves(userId);
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(null),
        insertOne: sinon.stub().resolves({ insertedId: 'file123' }),
      });
      fsExistsSyncStub.returns(false);
      fsWriteFileSyncStub.returns();

      const response = await request(app)
        .post('/upload')
        .set('x-token', token)
        .send({ name, type, parentId, isPublic, data });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(fsWriteFileSyncStub.calledOnce).toBe(true);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app)
        .post('/upload')
        .send({ name: 'file.txt', type: 'file', data: 'dGVzdA==' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      const token = 'validToken';
      const response = await request(app)
        .post('/upload')
        .set('x-token', token)
        .send({ type: 'file' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing name' });
    });
  });

  describe('GET /files/:id', () => {
    it('should show a file details', async () => {
      const token = 'validToken';
      const userId = 'user123';
      const file = {
        _id: 'file123',
        userId,
        name: 'file.txt',
        type: 'file',
        isPublic: false,
        parentId: 0,
      };

      redisGetStub.resolves(userId);
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(file),
      });

      const response = await request(app)
        .get('/files/file123')
        .set('x-token', token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(file);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app)
        .get('/files/file123');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if file not found', async () => {
      const token = 'validToken';
      redisGetStub.resolves('user123');
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(null),
      });

      const response = await request(app)
        .get('/files/file123')
        .set('x-token', token);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });

  describe('GET /files', () => {
    it('should list files', async () => {
      const token = 'validToken';
      const userId = 'user123';
      const files = [{ _id: 'file123', name: 'file.txt' }];

      redisGetStub.resolves(userId);
      dbCollectionStub.returns({
        find: sinon.stub().returns({
          skip: sinon.stub().returnsThis(),
          limit: sinon.stub().returnsThis(),
          toArray: sinon.stub().resolves(files),
        }),
      });

      const response = await request(app)
        .get('/files')
        .set('x-token', token)
        .query({ page: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(files);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app)
        .get('/files');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /files/:id/publish', () => {
    it('should publish a file', async () => {
      const token = 'validToken';
      const userId = 'user123';
      const file = {
        _id: 'file123',
        userId,
        name: 'file.txt',
        type: 'file',
        isPublic: false,
        parentId: 0,
      };

      redisGetStub.resolves(userId);
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(file),
        updateOne: sinon.stub().resolves(),
      });

      const response = await request(app)
        .put('/files/file123/publish')
        .set('x-token', token);

      expect(response.status).toBe(200);
      expect(response.body.isPublic).toBe(true);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app)
        .put('/files/file123/publish');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if file not found', async () => {
      const token = 'validToken';
      redisGetStub.resolves('user123');
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(null),
      });

      const response = await request(app)
        .put('/files/file123/publish')
        .set('x-token', token);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish a file', async () => {
      const token = 'validToken';
      const userId = 'user123';
      const file = {
        _id: 'file123',
        userId,
        name: 'file.txt',
        type: 'file',
        isPublic: true,
        parentId: 0,
      };

      redisGetStub.resolves(userId);
      dbCollectionStub.returns({
        findOne: sinon.stub().resolves(file),
        updateOne: sinon.stub().resolves(),
      });

      const response = await request(app)
        .put('/files/file123/unpublish')
        .set('x-token', token);

      expect(response.status).toBe(200);
      expect(response.body.isPublic).toBe(false);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app)
        .put('/files/file123/unpublish');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if file not found', async () => {
      const token = 'validToken';
      redisGetStub.resolves('user123');
     
