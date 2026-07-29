import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../server/routes/authRoutes.js';
import projectRoutes from '../server/routes/projectRoutes.js';
import contactRoutes from '../server/routes/contactRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Quantum Portfolio Backend API',
    timestamp: new Date().toISOString()
  });
});

export default app;
