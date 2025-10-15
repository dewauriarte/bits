# **APPQUIZ \- ESPECIFICACIÓN COMPLETA DEL PRODUCTO**

## **📋 ÍNDICE DE CONTENIDO**

1. Arquitectura Técnica y Stack  
2. Estructura de Base de Datos Completa  
3. Sistema de Roles y Permisos  
4. Módulos Principales  
5. Flujos Detallados por Rol  
6. Tipos de Juego  
7. Sistema de Animaciones  
8. Especificaciones Técnicas por Módulo

---

## **🏗️ 1\. ARQUITECTURA TÉCNICA Y STACK**

### **Stack Tecnológico Recomendado:**

FRONTEND:  
├─ React 18+ con TypeScript  
├─ Tailwind CSS \+ Shadcn/ui  
├─ Framer Motion (animaciones)  
├─ Socket.io-client (tiempo real)  
├─ React Query (cache y estado)  
├─ Zustand (estado global)  
└─ React Router v6

BACKEND:  
├─ Node.js \+ Express  
├─ TypeScript  
├─ Socket.io (WebSockets)  
├─ PostgreSQL (base de datos)  
├─ Prisma ORM  
├─ Redis (caché y sesiones)  
├─ Bull (colas de trabajos)  
└─ JWT (autenticación)

SERVICIOS EXTERNOS:  
├─ Claude API (Anthropic)  
├─ OpenAI API (alternativa)  
├─ AWS S3 / Cloudinary (almacenamiento)  
├─ YouTube Data API  
└─ Whisper API (transcripción audio)

INFRAESTRUCTURA:  
├─ Docker \+ Docker Compose  
├─ Nginx (proxy reverso)  
├─ PM2 (process manager)

└─ PostgreSQL \+ Redis

### **Arquitectura de Tiempo Real:**

┌─────────────────────────────────────────────┐  
│           CLIENTE (React)                   │  
│  ┌──────────────────────────────────────┐   │  
│  │  Socket.io Client                    │   │  
│  │  \- Conecta automáticamente           │   │  
│  │  \- Reconexión automática             │   │  
│  │  \- Heartbeat cada 25 segundos        │   │  
│  └──────────────────────────────────────┘   │  
└──────────────────┬──────────────────────────┘  
                   │  
                   │ WebSocket (wss://)  
                   │  
┌──────────────────▼──────────────────────────┐  
│          SERVIDOR (Node.js)                 │  
│  ┌──────────────────────────────────────┐   │  
│  │  Socket.io Server                    │   │  
│  │  \- Rooms por juego                   │   │  
│  │  \- Broadcast eventos                 │   │  
│  │  \- Rate limiting                     │   │  
│  └──────────────────────────────────────┘   │  
│                                             │  
│  ┌──────────────────────────────────────┐   │  
│  │  Redis (Estado en Memoria)           │   │  
│  │  \- Sesiones activas                  │   │  
│  │  \- Estado de juegos                  │   │  
│  │  \- Rankings en vivo                  │   │  
│  └──────────────────────────────────────┘   │  
│                                             │  
│  ┌──────────────────────────────────────┐   │  
│  │  PostgreSQL (Persistencia)           │   │  
│  │  \- Usuarios                          │   │  
│  │  \- Quizzes                           │   │  
│  │  \- Resultados históricos             │   │  
│  └──────────────────────────────────────┘   │

└─────────────────────────────────────────────┘