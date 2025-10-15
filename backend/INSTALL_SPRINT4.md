# Sprint 4 - Backend Installation Guide

## Dependencias Instaladas

Las siguientes dependencias ya están en `package.json`:
- ✅ `socket.io`: ^4.6.0
- ✅ `ioredis`: ^5.3.2

## Dependencia Opcional (Redis Adapter)

Para habilitar el Redis Adapter para escalabilidad horizontal (múltiples instancias):

```bash
npm install @socket.io/redis-adapter
```

Luego descomentar el código en `src/config/socket.ts` (líneas 22-35).

## Archivos Creados

### Tipos TypeScript
- ✅ `src/types/socket.types.ts` - Tipos para Socket.IO

### Configuración
- ✅ `src/config/socket.ts` - Setup de Socket.IO con autenticación JWT

### Servicios
- ✅ `src/services/room.service.ts` - RoomManager para gestión de salas

### Sockets
- ✅ `src/sockets/game.socket.ts` - Handlers de eventos WebSocket

### Controladores
- ✅ `src/controllers/room.controller.ts` - REST API para salas

### Rutas
- ✅ `src/routes/room.routes.ts` - Rutas de salas

### Actualizado
- ✅ `src/index.ts` - Configurado con Socket.IO
- ✅ `src/utils/jwt.ts` - Agregado campo `role` para compatibilidad

## Comandos de Instalación

```bash
cd backend

# Instalar dependencias si es necesario
npm install

# Opcional: Redis adapter para producción
# npm install @socket.io/redis-adapter

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones si hay cambios
npm run prisma:migrate

# Iniciar servidor en modo desarrollo
npm run dev
```

## Variables de Entorno Requeridas

Asegúrate de tener en tu `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/appquiz?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
REDIS_URL="redis://localhost:6379"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"
```

## Servicios Externos Requeridos

### PostgreSQL
Debe estar corriendo en el puerto configurado en `DATABASE_URL`.

### Redis (Recomendado)
```bash
# Windows (con Chocolatey)
choco install redis-64

# O usar Docker
docker run -d -p 6379:6379 redis:alpine

# O WSL/Linux
sudo apt-get install redis-server
redis-server
```

## API Endpoints Creados

### REST API

#### Crear Sala
```http
POST /api/rooms
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "quiz_id": "uuid",
  "config_juego": {
    "maxPlayers": 50,
    "allowLateJoin": true,
    "showLeaderboard": true,
    "timePerQuestion": 20
  }
}
```

#### Obtener Info de Sala (Público)
```http
GET /api/rooms/:code
```

#### Obtener Estado Completo de Sala (Solo Profesor)
```http
GET /api/rooms/:code/full
Authorization: Bearer <teacher_token>
```

#### Iniciar Juego (Solo Profesor)
```http
POST /api/rooms/:code/start
Authorization: Bearer <teacher_token>
```

#### Cerrar Sala (Solo Profesor)
```http
DELETE /api/rooms/:code
Authorization: Bearer <teacher_token>
```

#### Obtener Salas Activas del Profesor
```http
GET /api/rooms/teacher/active
Authorization: Bearer <teacher_token>
```

### WebSocket Events

#### Cliente → Servidor

**game:join** - Unirse a una sala
```typescript
socket.emit('game:join', {
  roomCode: 'ABC123',
  nickname: 'Juan',
  avatar: '😎'
}, (response) => {
  if (response.success) {
    console.log('Joined:', response.data);
  }
});
```

**game:ready** - Marcar listo/no listo
```typescript
socket.emit('game:ready', {
  roomCode: 'ABC123'
}, (response) => {
  console.log('Ready:', response.data.isReady);
});
```

**game:start** - Iniciar juego (solo profesor)
```typescript
socket.emit('game:start', {
  roomCode: 'ABC123'
}, (response) => {
  console.log('Game starting');
});
```

**game:leave** - Salir de la sala
```typescript
socket.emit('game:leave', (response) => {
  console.log('Left room');
});
```

**game:close** - Cerrar sala (solo profesor)
```typescript
socket.emit('game:close', {
  roomCode: 'ABC123'
}, (response) => {
  console.log('Room closed');
});
```

#### Servidor → Cliente

**player:joined** - Nuevo jugador se unió
```typescript
socket.on('player:joined', (data) => {
  console.log('New player:', data.player);
});
```

**player:left** - Jugador salió
```typescript
socket.on('player:left', (data) => {
  console.log('Player left:', data.playerId);
});
```

**player:disconnected** - Jugador se desconectó
```typescript
socket.on('player:disconnected', (data) => {
  console.log('Player disconnected:', data.playerId);
});
```

**player:ready** - Jugador cambió estado ready
```typescript
socket.on('player:ready', (data) => {
  console.log('Player ready:', data.playerId, data.isReady);
});
```

**room:updated** - Estado de sala actualizado
```typescript
socket.on('room:updated', (data) => {
  console.log('Room state:', data.room);
});
```

**game:starting** - Juego comenzando
```typescript
socket.on('game:starting', (data) => {
  console.log(data.message);
});
```

**game:countdown** - Countdown 3-2-1-GO!
```typescript
socket.on('game:countdown', (data) => {
  console.log(data.count, data.message);
});
```

**game:started** - Juego iniciado
```typescript
socket.on('game:started', (data) => {
  console.log('Game started');
});
```

**game:cancelled** - Juego cancelado
```typescript
socket.on('game:cancelled', (data) => {
  console.log(data.message);
});
```

**game:paused** - Juego pausado
```typescript
socket.on('game:paused', (data) => {
  console.log(data.message);
});
```

**game:closed** - Sala cerrada
```typescript
socket.on('game:closed', (data) => {
  console.log(data.message);
});
```

## Testing

### Test Manual con Postman/Thunder Client

1. **Crear Sala**
   - POST `http://localhost:3001/api/rooms`
   - Headers: `Authorization: Bearer <token>`
   - Body: Ver ejemplo arriba

2. **Ver Info de Sala**
   - GET `http://localhost:3001/api/rooms/ABC123`

### Test WebSocket con Socket.IO Client

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  
  socket.emit('game:join', {
    roomCode: 'ABC123',
    nickname: 'TestUser',
    avatar: '🎮'
  }, (response) => {
    console.log(response);
  });
});
```

## Estructura de BD

Las siguientes tablas en Prisma se usan:

- ✅ `salas` - Información de salas de juego
- ✅ `sala_participantes` - Jugadores en cada sala
- ✅ `quizzes` - Quiz asociado a la sala
- ✅ `usuarios` - Profesores y estudiantes

## Logs Esperados

Cuando todo funciona correctamente, deberías ver:

```
✅ Redis connected
🚀 Server running on http://localhost:3001
🔌 WebSocket server ready
Environment: development
✅ Room created: ABC123 for quiz Mathematics Quiz
✅ Socket authenticated: user-uuid-123
🔌 Client connected: socket-id-456 (User: user-uuid-123)
✅ Player Juan joined room ABC123
✅ Game started in room ABC123
```

## Troubleshooting

### Error: Redis connection failed
- Asegúrate de que Redis esté corriendo
- Verifica `REDIS_URL` en `.env`
- El sistema funcionará sin Redis, usando memoria local

### Error: Authentication error
- Verifica que el token JWT sea válido
- Asegúrate de enviar el token en `socket.handshake.auth.token`

### Error: Sala no encontrada
- Verifica que el código de sala sea correcto
- Revisa que la sala no haya expirado (4 horas por defecto)

### Error: Cannot find module '@socket.io/redis-adapter'
- Es opcional, el sistema funciona sin él
- Si lo necesitas: `npm install @socket.io/redis-adapter`

## Próximos Pasos (Sprint 5)

- [ ] Implementar gameplay completo (envío de preguntas)
- [ ] Sistema de respuestas y puntuación
- [ ] Leaderboard en tiempo real
- [ ] Timer management
- [ ] Testing automatizado
