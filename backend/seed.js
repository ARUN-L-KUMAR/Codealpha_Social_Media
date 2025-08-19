const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');
const Follow = require('./models/Follow');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Follow.deleteMany({});

    // Create sample users
    console.log('Creating sample users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await User.create([
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Full-stack developer passionate about React and Node.js',
        isVerified: true
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'UI/UX Designer and frontend developer',
        isVerified: false
      },
      {
        username: 'mikejohnson',
        email: 'mike@example.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Johnson',
        bio: 'DevOps engineer and cloud architect',
        isVerified: true
      },
      {
        username: 'sarahwilson',
        email: 'sarah@example.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Wilson',
        bio: 'Data scientist and machine learning enthusiast',
        isVerified: false
      },
      {
        username: 'alexchen',
        email: 'alex@example.com',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'Chen',
        bio: 'Mobile app developer and tech blogger',
        isVerified: true
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample posts with hashtags
    console.log('Creating sample posts...');
    const posts = await Post.create([
      {
        content: 'Just finished building an amazing #React application with #TypeScript! The type safety really makes a difference in large projects. #webdev #javascript',
        author: users[0]._id,
        tags: ['react', 'typescript', 'webdev', 'javascript'],
        visibility: 'public',
        likes: [
          { user: users[1]._id },
          { user: users[2]._id },
          { user: users[3]._id }
        ]
      },
      {
        content: 'Working on a new #UI design system using #Figma and #CSS Grid. Modern layouts are so much easier now! #design #frontend',
        author: users[1]._id,
        tags: ['ui', 'figma', 'css', 'design', 'frontend'],
        visibility: 'public',
        likes: [
          { user: users[0]._id },
          { user: users[4]._id }
        ]
      },
      {
        content: 'Successfully deployed a #microservices architecture on #AWS using #Docker and #Kubernetes. Scalability FTW! #devops #cloud',
        author: users[2]._id,
        tags: ['microservices', 'aws', 'docker', 'kubernetes', 'devops', 'cloud'],
        visibility: 'public',
        likes: [
          { user: users[0]._id },
          { user: users[1]._id },
          { user: users[3]._id },
          { user: users[4]._id }
        ]
      },
      {
        content: 'Just trained a new #MachineLearning model that achieved 95% accuracy! #Python and #TensorFlow make AI development so accessible. #AI #datascience',
        author: users[3]._id,
        tags: ['machinelearning', 'python', 'tensorflow', 'ai', 'datascience'],
        visibility: 'public',
        likes: [
          { user: users[0]._id },
          { user: users[2]._id }
        ]
      },
      {
        content: 'New blog post is live: "10 Tips for Better #MobileApp Performance" covering #React Native optimization techniques. #mobile #performance',
        author: users[4]._id,
        tags: ['mobileapp', 'reactnative', 'mobile', 'performance'],
        visibility: 'public',
        likes: [
          { user: users[1]._id },
          { user: users[2]._id },
          { user: users[3]._id }
        ]
      },
      {
        content: 'Amazing conference talk about #GraphQL and #Apollo today! Really excited to implement these in our next project. #javascript #backend',
        author: users[0]._id,
        tags: ['graphql', 'apollo', 'javascript', 'backend'],
        visibility: 'public',
        likes: [
          { user: users[4]._id }
        ]
      },
      {
        content: 'Code review best practices every developer should know! #codereview #bestpractices #teamwork #programming',
        author: users[1]._id,
        tags: ['codereview', 'bestpractices', 'teamwork', 'programming'],
        visibility: 'public',
        likes: [
          { user: users[0]._id },
          { user: users[2]._id },
          { user: users[3]._id },
          { user: users[4]._id }
        ]
      },
      {
        content: 'Loving the new features in #MongoDB 7.0! The aggregation pipeline improvements are game-changing. #database #nosql',
        author: users[2]._id,
        tags: ['mongodb', 'database', 'nosql'],
        visibility: 'public',
        likes: [
          { user: users[0]._id },
          { user: users[3]._id }
        ]
      }
    ]);

    console.log(`Created ${posts.length} posts`);

    // Create follow relationships
    console.log('Creating follow relationships...');
    const followRelationships = [
      { follower: users[0]._id, following: users[1]._id },
      { follower: users[0]._id, following: users[2]._id },
      { follower: users[1]._id, following: users[0]._id },
      { follower: users[1]._id, following: users[3]._id },
      { follower: users[2]._id, following: users[0]._id },
      { follower: users[2]._id, following: users[4]._id },
      { follower: users[3]._id, following: users[1]._id },
      { follower: users[3]._id, following: users[4]._id },
      { follower: users[4]._id, following: users[2]._id },
      { follower: users[4]._id, following: users[3]._id }
    ];

    await Follow.create(followRelationships);

    // Update user followers and following arrays
    for (const relationship of followRelationships) {
      await User.findByIdAndUpdate(relationship.follower, {
        $push: { following: relationship.following }
      });
      await User.findByIdAndUpdate(relationship.following, {
        $push: { followers: relationship.follower }
      });
    }

    console.log(`Created ${followRelationships.length} follow relationships`);

    console.log('Seed data creation completed successfully!');
    console.log('\nSample users created:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
