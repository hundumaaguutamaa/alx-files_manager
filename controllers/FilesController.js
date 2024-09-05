const { v4: uuidv4 } = require('uuid');  // For generating UUIDs
const path = require('path');
const fs = require('fs');
const dbClient = require('../utils/db');  // Assume a MongoDB client
const redisClient = require('../utils/redis');  // Redis client for token management

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';  // Default storage path

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.collection('files').findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Prepare file document
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: null,
    };

    // Handle folder creation
    if (type === 'folder') {
      const result = await dbClient.collection('files').insertOne(newFile);
      return res.status(201).json({ id: result.insertedId, ...newFile });
    }

    // Create storage folder if it doesn't exist
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    // Generate unique filename
    const localPath = path.join(FOLDER_PATH, uuidv4());

    // Save the file in local storage (base64 decoding)
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, buffer);

    // Add the file path and save to DB
    newFile.localPath = localPath;
    const result = await dbClient.collection('files').insertOne(newFile);

    return res.status(201).json({ id: result.insertedId, ...newFile });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const file = await dbClient.collection('files').findOne({
      _id: id,
      userId,
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId === 0 ? 0 : file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = parseInt(req.query.parentId, 10) || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const filesFilter = {
      userId,
      parentId: parentId === 0 ? 0 : parentId,
    };

    const files = await dbClient.collection('files').find(filesFilter)
      .skip(page * 20)
      .limit(20)
      .toArray();

    res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const file = await dbClient.collection('files').findOne({
      _id: id,
      userId,
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.collection('files').updateOne(
      { _id: id, userId },
      { $set: { isPublic: true } }
    );

    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId === 0 ? 0 : file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const file = await dbClient.collection('files').findOne({
      _id: id,
      userId,
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.collection('files').updateOne(
      { _id: id, userId },
      { $set: { isPublic: false } }
    );

    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId === 0 ? 0 : file.parentId,
    });
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const size = req.query.size || null;

    const file = await dbClient.collection('files').findOne({
      _id: id,
    });

    if (!file || (!file.isPublic && file.userId.toString() !== userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'A folder doesn\'t have content' });
    }

    let filePath = file.localPath;
    if (size) {
      filePath = `${file.localPath}_${size}`;
    }

    if (fs.existsSync(filePath)) {
      const fileInfo = fs.statSync(filePath);
      if (!fileInfo.isFile()) {
        return res.status(404).json({ error: 'Not found' });
      }
    } else {
      return res.status(404).json({ error: 'Not found' });
    }

    const absoluteFilePath = path.resolve(filePath);
    res.setHeader('Content-Type', require('mime-types').contentType(file.name) || 'text/plain; charset=utf-8');
    res.status(200).sendFile(absoluteFilePath);
  }
}

module.exports = FilesController;
