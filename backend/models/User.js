import mongoose from 'mongoose';
import { mockDatabase } from '../config/db.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor'], required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

mockDatabase.users.set('doctor@viora.org', {
  id: 'usr-doctor-001',
  email: 'doctor@viora.org',
  passwordHash: '$2a$10$10tIHJ6q4QtcxrNGs76/NOe3.B37c.MTFqa8WA3npiTidgKOs.4u2',
  role: 'doctor',
  name: 'Dr. Rahul Sharma'
});

export const UserModel = {
  findByEmail: async (email) => {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    const mockUser = mockDatabase.users.get(normalizedEmail);
    if (mockUser) return mockUser;

    if (mongoose.connection.readyState === 1) {
      const user = await MongooseUser.findOne({ email: normalizedEmail }).lean();
      return user || null;
    }

    return null;
  },

  findById: async (id) => {
    if (!id) return null;
    for (const user of mockDatabase.users.values()) {
      if (user.id === id || String(user._id) === String(id)) return user;
    }

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const user = await MongooseUser.findById(id).lean();
      return user || null;
    }

    return null;
  }
};
