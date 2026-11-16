import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, checkDbStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Security & Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// System Health & SIH 2026 Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'Viora multilingual patient intake',
    timestamp: new Date().toISOString(),
    database: checkDbStatus()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/case', caseRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Viora API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
