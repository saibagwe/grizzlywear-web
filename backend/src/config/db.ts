import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    if (!env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set. Skipping database connection.');
      return;
    }

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
    });

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnect...');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}
