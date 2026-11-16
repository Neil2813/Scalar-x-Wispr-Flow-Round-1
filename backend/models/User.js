import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor'], required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

export const UserModel = {
  findByEmail: async (email) => {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await MongooseUser.findOne({ email: normalizedEmail }).lean();
    return user || null;
  },

  findById: async (id) => {
    if (!id) return null;
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await MongooseUser.findById(id).lean();
    return user || null;
  },

  create: async ({ email, passwordHash, name }) => {
    const user = await MongooseUser.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'doctor',
      name: name.trim()
    });
    return user.toObject();
  }
};
