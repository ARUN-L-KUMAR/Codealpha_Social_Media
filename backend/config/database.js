const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Add connection options for better stability
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // Try to provide more helpful error message
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('💡 Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas cluster is running');
      console.error('3. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('4. Verify the connection string in .env file');
    }
    
    // Don't exit immediately, give it another chance
    setTimeout(() => {
      console.log('Retrying database connection in 5 seconds...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
