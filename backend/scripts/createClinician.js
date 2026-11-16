import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';

dotenv.config();

const requiredValues = ['MONGO_URI', 'CLINICIAN_EMAIL', 'CLINICIAN_NAME', 'CLINICIAN_PASSWORD'];
const missingValues = requiredValues.filter((key) => !process.env[key]);

if (missingValues.length) {
  console.error(`Set these environment variables before creating a clinician: ${missingValues.join(', ')}`);
  process.exitCode = 1;
} else if (process.env.CLINICIAN_PASSWORD.length < 12) {
  console.error('CLINICIAN_PASSWORD must be at least 12 characters.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const passwordHash = await bcrypt.hash(process.env.CLINICIAN_PASSWORD, 12);
    const user = await UserModel.create({
      email: process.env.CLINICIAN_EMAIL,
      name: process.env.CLINICIAN_NAME,
      passwordHash
    });
    console.log(`Clinician account created for ${user.email}.`);
  } catch (error) {
    console.error('Clinician account could not be created:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
