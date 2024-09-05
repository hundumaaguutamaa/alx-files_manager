import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull';
import imgThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

// Promisify writeFile for async/await
const writeFileAsync = promisify(writeFile);

// Create Bull queues
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

/**
 * Generates the thumbnail of an image with a given width size.
 * @param {String} filePath The location of the original file.
 * @param {number} size The width of the thumbnail.
 * @returns {Promise<void>}
 */
const generateThumbnail = async (filePath, size) => {
  try {
    const buffer = await imgThumbnail(filePath, { width: size });
    await writeFileAsync(`${filePath}_${size}`, buffer);
  } catch (error) {
    console.error(`Error generating thumbnail for ${filePath} with size ${size}:`, error);
  }
};

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }
  if (!userId) {
    return done(new Error('Missing userId'));
  }

  try {
    const file = await (await dbClient.filesCollection())
      .findOne({
        _id: fileId,
        userId,
      });

    if (!file) {
      return done(new Error('File not found'));
    }

    const sizes = [500, 250, 100];
    await Promise.all(sizes.map(size => generateThumbnail(file.localPath, size)));
    done();
  } catch (error) {
    done(error);
  }
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    return done(new Error('Missing userId'));
  }

  try {
    const user = await (await dbClient.usersCollection())
      .findOne({ _id: userId });

    if (!user) {
      return done(new Error('User not found'));
    }

    // Example: Use a mock or real email sending service here
    console.log(`Welcome ${user.email}!`);
    done();
  } catch (error) {
    done(error);
  }
});

