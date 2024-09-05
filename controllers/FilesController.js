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
}

module.exports = FilesController;

