import mongoose from 'mongoose';
import { Product } from './src/models/Product.js';
import { Category } from './src/models/Category.js';
import dotenv from 'dotenv';
dotenv.config();
const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const category = await Category.findOne();
    await Product.create({
      name: 'Test Product ' + Math.random(),
      description: 'Test Desc',
      price: 100,
      stock: 50,
      category: category ? category._id : new mongoose.Types.ObjectId(),
    });
    console.log('Success');
  } catch (err) {
    console.log('VALIDATION ERROR:', err.message);
    if(err.errors) console.log(Object.keys(err.errors));
  }
  process.exit();
};
run();
