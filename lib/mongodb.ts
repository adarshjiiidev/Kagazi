import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('authentication failed') || error.code === 8000) {
          console.error('\n🔧 SETUP REQUIRED: MongoDB authentication failed.');
          console.error('   Please check your MONGODB_URI in .env.local');
          console.error('   Make sure username, password, and cluster name are correct.');
          console.error('   See QUICK_SETUP.md for detailed instructions.\n');
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error('\n🔧 SETUP REQUIRED: MongoDB connection refused.');
          console.error('   If using local MongoDB: Make sure MongoDB service is running.');
          console.error('   If using MongoDB Atlas: Check your connection string.');
          console.error('   See QUICK_SETUP.md for setup instructions.\n');
        }
        
        cached.promise = null; // Reset promise so we can retry
        throw error;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise for next attempt
    throw error;
  }
}

export default dbConnect;
