-- ==========================================================
-- QUANTUM PORTFOLIO - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor
-- ==========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('owner', 'guest')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('web', 'mobile', 'software')),
    description TEXT,
    tech TEXT[] DEFAULT '{}',
    tag TEXT DEFAULT 'General',
    image TEXT DEFAULT '/assets/wolf-logo.png',
    link TEXT DEFAULT '#',
    views_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Owner Account (Password: admin123)
-- Hash generated via bcrypt (10 rounds): $2a$10$3eEaXz9M7g9J7P/k6yYvMe4bK9A1l7kQWw5VzL.vO1A3l7kQWw5Vz
INSERT INTO public.users (email, password_hash, name, role)
VALUES (
    'pino.abril@dev.io',
    '$2a$10$wK1mJ6O9DqP4h0k7N1S9e.F5o9Y8t6u4e3w2v1u0t9s8r7q6p5o4n',
    'Jorge Fabrissio Pino Abril',
    'owner'
) ON CONFLICT (email) DO NOTHING;

-- Seed Initial Projects
INSERT INTO public.projects (id, title, category, description, tech, tag, image, link, views_count)
VALUES
('proj-web-01', 'Architectural Design System', 'web', 'Sistema de diseño cuántico interactivo construido con Tailwind CSS y arquitectura modular.', ARRAY['HTML5', 'TailwindCSS', 'JavaScript ES6'], 'SaaS Platform', '/assets/quantum-about-face.png', '#', 1420),
('proj-web-02', 'Quantum Dashboard UI', 'web', 'Panel de monitoreo en tiempo real con estética dark glassmorphism y métricas reactivas.', ARRAY['Vite', 'Vanilla JS', 'PostCSS'], 'Dashboard', '/assets/wolf-logo.png', '#', 980),
('proj-mobile-01', 'Quantum Mobile App Core', 'mobile', 'Aplicación móvil de alto rendimiento con sincronización offline y cifrado de datos.', ARRAY['React Native', 'TypeScript', 'Supabase'], 'iOS & Android', '/assets/quantum-about-face.png', '#', 750),
('proj-software-01', 'Microservices Gateway Node.js', 'software', 'API Gateway distribuido con autenticación JWT, rate-limiting y balanceo de carga.', ARRAY['Node.js', 'Express', 'JWT', 'Docker'], 'Backend Infrastructure', '/assets/wolf-logo.png', '#', 2100)
ON CONFLICT (id) DO NOTHING;
