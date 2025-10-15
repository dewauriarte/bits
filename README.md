# AppQuiz - Plataforma Educativa Gamificada

Sistema de quizzes educativos con gamificación inspirado en Kahoot y Mario Party.

## 🚀 Stack Tecnológico

### Backend
- Node.js + TypeScript
- Express
- Prisma (PostgreSQL)
- Redis
- JWT + bcrypt
- Zod (validación)
- Socket.io (tiempo real)

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- Zustand (state)
- TanStack Query
- Axios
- Framer Motion

## 📦 Instalación

### 1. Backend

```bash
cd backend
npm install
```

Configurar `.env`:
```bash
cp .env.example .env
# Editar con tus credenciales
```

Ejecutar base de datos:
```bash
# Crear BD en PostgreSQL
psql -U postgres
CREATE DATABASE appquiz;
\c appquiz
\i bd/bits.sql
\q

# Generar Prisma Client
npx prisma generate

# Ejecutar seed (solo primera vez)
npm run prisma:seed
```

### 2. Frontend

```bash
cd frontend
npm install
```

Configurar `.env`:
```bash
cp .env.example .env
```

## 🏃 Desarrollo

```bash
# Backend (puerto 3001)
cd backend
npm run dev

# Frontend (puerto 5173)
cd frontend
npm run dev
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

## 👥 Usuarios de Prueba

```
Admin:
- username: admin
- password: Admin123!

Profesor:
- username: prof_maria
- password: Prof123!

Estudiante:
- username: est_juan
- password: Est123!
```

## 📝 Progreso

Ver `inportant/Sprint 1.md` para el progreso actual del proyecto.
