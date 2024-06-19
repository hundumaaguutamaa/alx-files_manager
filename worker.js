#!/usr/bin/node
const fileQueue = require('./fileQueue');

// Process jobs from 'fileQueue'
fileQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

fileQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

fileQueue.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  // Check if fileId and userId are present
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  // Simulate checking if document exists in DB based on fileId and userId
  // In a real application, this would involve querying your database
  const documentExists = true; // Assuming document exists

  if (!documentExists) {
    throw new Error('File not found');
  }

  // Generate thumbnails with image-thumbnail module
  const thumbnailSizes = [500, 250, 100];
  const thumbnailResults = await Promise.all(thumbnailSizes.map(async (size) => {
    // Simulate generating thumbnail (replace with actual logic)
    const thumbnailUrl = `/path/to/thumbnail_${size}.jpg`; // Replace with actual saving logic
    return { size, thumbnailUrl };
  }));

  // Example logging
  console.log(`Generated thumbnails for fileId ${fileId}, userId ${userId}`);

  return { success: true };
});

// Start processing the queue
fileQueue.on('ready', () => {
  console.log('Worker is ready and listening for jobs');
});

// Handle global errors
fileQueue.on('error', (error) => {
  console.error('Global queue error:', error);
});

// Start processing jobs
fileQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

fileQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

// Optionally start the worker
fileQueue.process();


