import express from 'express';
import supabase from '../config/db.js';
import { verifyToken, requireOwnerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

let inMemoryMessages = [];

// POST /api/contact - Public endpoint for submitting contact transmission
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Por favor complete los campos obligatorios (nombre, correo y mensaje).' });
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    name,
    email,
    subject: subject || 'Consulta Portfolio',
    message,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase.from('contact_messages').insert([newMessage]).select();
    if (!error && data) {
      return res.status(201).json({ message: 'Mensaje recibido y guardado en Supabase.', data: data[0] });
    }
  }

  inMemoryMessages.unshift(newMessage);
  return res.status(201).json({ message: 'Mensaje transmitido exitosamente con Jorge Fabrissio.' });
});

// GET /api/contact - Owner Only: List all received messages
router.get('/', verifyToken, requireOwnerRole, async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return res.json(data);
    }
  }

  return res.json(inMemoryMessages);
});

export default router;
