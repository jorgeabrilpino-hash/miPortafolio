import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import supabase from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quantum_jwt_secret_key_987654321';

// Default in-memory seed admin credentials for immediate testing
const defaultOwner = {
  id: 'usr_owner_001',
  email: process.env.ADMIN_EMAIL || 'pino.abril@dev.io',
  name: 'Jorge Fabrissio Pino Abril',
  role: 'owner',
  // bcrypt hash for process.env.ADMIN_PASSWORD || 'admin123'
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, proporcione correo y contraseña.' });
  }

  let foundUser = null;

  // Try fetching from Supabase if connected
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!error && data) {
      const match = await bcrypt.compare(password, data.password_hash);
      if (match) {
        foundUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role
        };
      }
    }
  }

  // Fallback to default owner login if not found in Supabase
  if (!foundUser) {
    if (email.toLowerCase() === defaultOwner.email.toLowerCase()) {
      const isMatch = await bcrypt.compare(password, defaultOwner.passwordHash);
      if (isMatch) {
        foundUser = {
          id: defaultOwner.id,
          email: defaultOwner.email,
          name: defaultOwner.name,
          role: defaultOwner.role
        };
      }
    }
  }

  if (!foundUser) {
    return res.status(401).json({ message: 'Credenciales inválidas. Correo o contraseña incorrectos.' });
  }

  // Generate JWT token containing user id, email, and role
  const token = jwt.sign(
    { id: foundUser.id, email: foundUser.email, name: foundUser.name, role: foundUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    message: 'Inicio de sesión exitoso',
    token,
    user: foundUser
  });
});

// GET /api/auth/me - Verify current active JWT session
router.get('/me', verifyToken, (req, res) => {
  return res.json({
    user: req.user
  });
});

export default router;
