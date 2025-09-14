import mongoose from 'mongoose';

export async function initMongo(uri: string) {
  await mongoose.connect(uri);
  console.log('Mongo connected');
}
