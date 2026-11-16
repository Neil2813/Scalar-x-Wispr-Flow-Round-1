import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user || String(user.role).toLowerCase() !== 'doctor') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ ...user, role: 'doctor' });
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id || String(user._id),
        name: user.name,
        email: user.email,
        role: 'doctor'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (String(user.role).toLowerCase() !== 'doctor') {
      return res.status(403).json({ error: 'Clinician access is required.' });
    }

    return res.json({
      user: {
        id: user.id || String(user._id),
        name: user.name,
        email: user.email,
        role: String(user.role).toLowerCase()
      }
    });
  } catch (error) {
    console.error('Current user lookup failed:', error);
    return res.status(500).json({ error: 'Could not load the current user.' });
  }
};
