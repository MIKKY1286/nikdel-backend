import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const deleteUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users from the database.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
};

deleteUsers();
