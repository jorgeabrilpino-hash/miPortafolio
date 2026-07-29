import express from 'express';
import supabase from '../config/db.js';
import { verifyToken, requireOwnerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initial sample projects data store (fallback if Supabase table is empty or disconnected)
let initialProjects = [
  {
    id: 'proj-web-01',
    category: 'web',
    title: 'Architectural Design System',
    description: 'Sistema de diseño cuántico interactivo construido con Tailwind CSS y arquitectura modular.',
    tech: ['HTML5', 'TailwindCSS', 'JavaScript ES6'],
    tag: 'SaaS Platform',
    image: '/assets/quantum-about-face.png',
    link: '#',
    views_count: 1420
  },
  {
    id: 'proj-web-02',
    category: 'web',
    title: 'Quantum Dashboard UI',
    description: 'Panel de monitoreo en tiempo real con estética dark glassmorphism y métricas reactivas.',
    tech: ['Vite', 'Vanilla JS', 'PostCSS'],
    tag: 'Dashboard',
    image: '/assets/wolf-logo.png',
    link: '#',
    views_count: 980
  },
  {
    id: 'proj-mobile-01',
    category: 'mobile',
    title: 'Quantum Mobile App Core',
    description: 'Aplicación móvil de alto rendimiento con sincronización offline y cifrado de datos.',
    tech: ['React Native', 'TypeScript', 'Supabase'],
    tag: 'iOS & Android',
    image: '/assets/quantum-about-face.png',
    link: '#',
    views_count: 750
  },
  {
    id: 'proj-software-01',
    category: 'software',
    title: 'Microservices Gateway Node.js',
    description: 'API Gateway distribuido con autenticación JWT, rate-limiting y balanceo de carga.',
    tech: ['Node.js', 'Express', 'JWT', 'Docker'],
    tag: 'Backend Infrastructure',
    image: '/assets/wolf-logo.png',
    link: '#',
    views_count: 2100
  }
];

// GET /api/projects - Public: List projects (optionally filter by category)
router.get('/', async (req, res) => {
  const { category } = req.query;

  if (supabase) {
    let query = supabase.from('projects').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return res.json(data);
    }
  }

  // Fallback in-memory list
  let result = initialProjects;
  if (category) {
    result = result.filter(p => p.category === category);
  }
  return res.json(result);
});

// POST /api/projects - Owner Only: Create a new project
router.post('/', verifyToken, requireOwnerRole, async (req, res) => {
  const { title, category, description, tech, tag, image, link } = req.body;

  if (!title || !category) {
    return res.status(400).json({ message: 'El título y la categoría son obligatorios.' });
  }

  const newProject = {
    id: `proj-${Date.now()}`,
    title,
    category, // 'web', 'mobile', 'software'
    description: description || '',
    tech: Array.isArray(tech) ? tech : (tech ? tech.split(',').map(t => t.trim()) : []),
    tag: tag || 'General',
    image: image || '/assets/wolf-logo.png',
    link: link || '#',
    views_count: 0,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase.from('projects').insert([newProject]).select();
    if (!error && data) {
      return res.status(201).json({ message: 'Proyecto creado exitosamente en Supabase.', project: data[0] });
    }
  }

  initialProjects.unshift(newProject);
  return res.status(201).json({ message: 'Proyecto creado exitosamente.', project: newProject });
});

// DELETE /api/projects/:id - Owner Only: Remove a project
router.delete('/:id', verifyToken, requireOwnerRole, async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      return res.json({ message: 'Proyecto eliminado de Supabase exitosamente.' });
    }
  }

  initialProjects = initialProjects.filter(p => p.id !== id);
  return res.json({ message: 'Proyecto eliminado exitosamente.' });
});

export default router;
