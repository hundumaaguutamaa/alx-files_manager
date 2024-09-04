const express = require('express');
const routes = require('./routes/index');
const redisClient = require('./utils/redis');  
const dbClient = require('./utils/db');  

const app = express();
const port = process.env.PORT || 5000;

// Middleware for parsing JSON
app.use(express.json());

// Load all routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
