const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Notification = require('./models/Notification');
const Post = require('./models/Post');

async function createTestNotifications() {
  try {
    console.log('Creating test notifications...');
    
    // Find or create test users
    let testUser1 = await User.findOne({ username: 'testuser1' });
    if (!testUser1) {
      testUser1 = new User({
        username: 'testuser1',
        email: 'test1@example.com',
        firstName: 'Test',
        lastName: 'User1',
        password: 'hashedpassword123' // This should be hashed in real scenario
      });
      await testUser1.save();
    }

    let testUser2 = await User.findOne({ username: 'testuser2' });
    if (!testUser2) {
      testUser2 = new User({
        username: 'testuser2',
        email: 'test2@example.com',
        firstName: 'Test',
        lastName: 'User2',
        password: 'hashedpassword123' // This should be hashed in real scenario
      });
      await testUser2.save();
    }

    // Create a test post
    let testPost = await Post.findOne({ author: testUser1._id });
    if (!testPost) {
      testPost = new Post({
        author: testUser1._id,
        content: 'This is a test post for notifications!',
        createdAt: new Date()
      });
      await testPost.save();
    }

    // Create test notifications
    const notifications = [
      {
        recipient: testUser1._id,
        sender: testUser2._id,
        type: 'follow',
        message: 'started following you',
      },
      {
        recipient: testUser1._id,
        sender: testUser2._id,
        type: 'like',
        message: 'liked your post',
        relatedPost: testPost._id,
      },
      {
        recipient: testUser1._id,
        sender: testUser2._id,
        type: 'comment',
        message: 'commented on your post',
        relatedPost: testPost._id,
      }
    ];

    // Delete existing test notifications
    await Notification.deleteMany({ 
      recipient: testUser1._id,
      sender: testUser2._id 
    });

    // Create new notifications
    for (const notifData of notifications) {
      const notification = new Notification(notifData);
      await notification.save();
      console.log(`Created notification: ${notification.type}`);
    }

    console.log('Test notifications created successfully!');
    console.log(`User 1 ID: ${testUser1._id}`);
    console.log(`User 2 ID: ${testUser2._id}`);
    console.log(`Post ID: ${testPost._id}`);
    
  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestNotifications();
