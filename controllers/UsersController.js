import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('email sending');

class UsersController {
  static async postNew(req, res) {
    // (Existing code for adding new user to DB)

    try {
      const newUser = await dbClient.db.collection('users').insertOne({
        // User data from req.body
      });

      // Add job to userQueue for sending welcome email
      await userQueue.add({
        userId: newUser.insertedId
      });

      return res.status(201).json({ id: newUser.insertedId });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
