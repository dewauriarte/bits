# Quick Test Guide - Sprint 4 Backend

## Pre-requisitos

```bash
# 1. PostgreSQL corriendo
# 2. Redis corriendo (opcional)
# 3. Backend dependencies instaladas
cd backend
npm install

# 4. Variables de entorno configuradas
cp .env.example .env
# Editar .env con tus valores
```

## Paso 1: Iniciar el Servidor

```bash
cd backend
npm run dev
```

**Salida esperada:**
```
✅ Redis connected
🚀 Server running on http://localhost:3001
🔌 WebSocket server ready
Environment: development
```

## Paso 2: Obtener Token JWT

### Opción A: Login como Profesor

```bash
# Usando curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'

# Guarda el accessToken que recibas
```

### Opción B: Usar token existente
Si ya tienes un token del frontend, úsalo directamente.

## Paso 3: Crear una Sala (REST API)

```bash
# Reemplaza <TOKEN> con tu JWT
# Reemplaza <QUIZ_ID> con un quiz ID válido de tu BD

curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "quiz_id": "<QUIZ_ID>",
    "config_juego": {
      "maxPlayers": 10,
      "allowLateJoin": true,
      "timePerQuestion": 20
    }
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "room": {
      "roomCode": "A1B2C3",
      "quizId": "...",
      "quizTitle": "Mathematics Quiz",
      "teacherId": "...",
      "teacherName": "Prof. García",
      "status": "lobby",
      "players": [],
      "config": {...},
      "createdAt": "2024-..."
    },
    "join_url": "http://localhost:5173/game/join?code=A1B2C3"
  },
  "message": "Sala creada exitosamente"
}
```

**Guarda el `roomCode` para los siguientes pasos!**

## Paso 4: Ver Info de la Sala (Público)

```bash
# Reemplaza A1B2C3 con tu roomCode
curl http://localhost:3001/api/rooms/A1B2C3
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "roomCode": "A1B2C3",
    "quizTitle": "Mathematics Quiz",
    "teacherName": "Prof. García",
    "status": "lobby",
    "playerCount": 0,
    "maxPlayers": 10,
    "allowLateJoin": true
  }
}
```

## Paso 5: Test WebSocket con Node.js Script

Crea un archivo `test-socket.js`:

```javascript
const io = require('socket.io-client');

const TOKEN = 'tu_token_jwt_aqui';
const ROOM_CODE = 'A1B2C3'; // Tu código de sala

const socket = io('http://localhost:3001', {
  auth: {
    token: TOKEN
  }
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  // Test: Unirse como estudiante
  socket.emit('game:join', {
    roomCode: ROOM_CODE,
    nickname: 'TestStudent',
    avatar: '🎮'
  }, (response) => {
    console.log('Join response:', response);

    if (response.success) {
      console.log('✅ Joined successfully!');
      console.log('Player ID:', response.data.playerId);
      console.log('Room Players:', response.data.room.players);
    } else {
      console.error('❌ Join failed:', response.message);
    }
  });
});

socket.on('player:joined', (data) => {
  console.log('🎉 New player joined:', data.player);
});

socket.on('room:updated', (data) => {
  console.log('🔄 Room updated:', {
    status: data.room.status,
    playerCount: data.room.players.length
  });
});

socket.on('game:countdown', (data) => {
  console.log(`⏱️  Countdown: ${data.count} - ${data.message}`);
});

socket.on('game:started', (data) => {
  console.log('🚀 Game started!', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});
```

Ejecutar:
```bash
node test-socket.js
```

## Paso 6: Test Completo con 2 Clientes

### Terminal 1: Profesor

```javascript
// profesor.js
const io = require('socket.io-client');

const TOKEN = 'token_del_profesor';
const ROOM_CODE = 'A1B2C3';

const socket = io('http://localhost:3001', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log('👨‍🏫 Profesor connected');

  // Unirse al room para escuchar eventos
  socket.emit('game:join', {
    roomCode: ROOM_CODE,
    nickname: 'Prof. García',
    avatar: '👨‍🏫'
  });

  // Esperar 5 segundos y luego iniciar
  setTimeout(() => {
    console.log('🚀 Starting game...');
    socket.emit('game:start', {
      roomCode: ROOM_CODE
    }, (response) => {
      console.log('Start response:', response);
    });
  }, 5000);
});

socket.on('player:joined', (data) => {
  console.log('✅ Student joined:', data.player.nickname);
});

socket.on('game:countdown', (data) => {
  console.log(`⏱️  ${data.message}`);
});

socket.on('game:started', () => {
  console.log('✅ Game is now active!');
});
```

### Terminal 2: Estudiante 1

```javascript
// estudiante1.js
const io = require('socket.io-client');

const TOKEN = 'token_estudiante_1';
const ROOM_CODE = 'A1B2C3';

const socket = io('http://localhost:3001', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log('🎓 Student 1 connected');

  socket.emit('game:join', {
    roomCode: ROOM_CODE,
    nickname: 'Juan',
    avatar: '😎'
  }, (response) => {
    if (response.success) {
      console.log('✅ Joined room!');

      // Marcar ready después de 2 segundos
      setTimeout(() => {
        socket.emit('game:ready', {
          roomCode: ROOM_CODE
        });
      }, 2000);
    }
  });
});

socket.on('player:ready', (data) => {
  console.log('✅ Player ready:', data.playerId);
});

socket.on('game:starting', () => {
  console.log('🎮 Game is starting!');
});

socket.on('game:countdown', (data) => {
  console.log(`⏱️  ${data.message}`);
});
```

### Terminal 3: Estudiante 2

```javascript
// estudiante2.js
const io = require('socket.io-client');

const TOKEN = 'token_estudiante_2';
const ROOM_CODE = 'A1B2C3';

const socket = io('http://localhost:3001', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log('🎓 Student 2 connected');

  socket.emit('game:join', {
    roomCode: ROOM_CODE,
    nickname: 'María',
    avatar: '🌟'
  }, (response) => {
    console.log('Join response:', response.success);
  });
});

socket.on('player:joined', (data) => {
  console.log('👋 Other player:', data.player.nickname);
});

socket.on('game:countdown', (data) => {
  console.log(`⏱️  ${data.message}`);
});
```

Ejecutar en orden:
```bash
# Terminal 1
node profesor.js

# Terminal 2 (esperar 1 segundo)
node estudiante1.js

# Terminal 3 (esperar 1 segundo)
node estudiante2.js
```

## Paso 7: Verificar en la Base de Datos

```sql
-- Ver salas creadas
SELECT codigo, estado, fecha_creacion 
FROM salas 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- Ver participantes de una sala
SELECT sp.nickname, sp.avatar, sp.estado
FROM sala_participantes sp
JOIN salas s ON sp.sala_id = s.id
WHERE s.codigo = 'A1B2C3';

-- Ver timeline de eventos
SELECT * FROM login_history 
WHERE sala_id IN (SELECT id FROM salas WHERE codigo = 'A1B2C3')
ORDER BY fecha_login DESC;
```

## Checklist de Funcionalidades

### ✅ REST API
- [ ] POST /api/rooms - Crear sala
- [ ] GET /api/rooms/:code - Info pública
- [ ] GET /api/rooms/:code/full - Estado completo (profesor)
- [ ] POST /api/rooms/:code/start - Iniciar juego
- [ ] DELETE /api/rooms/:code - Cerrar sala
- [ ] GET /api/rooms/teacher/active - Salas activas

### ✅ WebSocket Events (Cliente → Servidor)
- [ ] game:join - Unirse a sala
- [ ] game:ready - Marcar ready
- [ ] game:start - Iniciar juego
- [ ] game:leave - Salir de sala
- [ ] game:close - Cerrar sala
- [ ] disconnect - Desconexión

### ✅ WebSocket Events (Servidor → Cliente)
- [ ] player:joined - Jugador se unió
- [ ] player:left - Jugador salió
- [ ] player:disconnected - Jugador desconectado
- [ ] player:ready - Estado ready cambió
- [ ] room:updated - Sala actualizada
- [ ] game:starting - Juego comenzando
- [ ] game:countdown - Countdown 3-2-1-GO
- [ ] game:started - Juego iniciado
- [ ] game:cancelled - Juego cancelado
- [ ] game:paused - Juego pausado
- [ ] game:closed - Sala cerrada

### ✅ Validaciones
- [ ] JWT auth requerido
- [ ] Código de sala único
- [ ] Nickname único por sala
- [ ] Max players respetado
- [ ] Solo profesor puede start/close
- [ ] Solo puede iniciar en estado lobby
- [ ] Mínimo 1 jugador para iniciar

### ✅ Limpieza
- [ ] Disconnect limpia participante
- [ ] Close sala limpia memoria
- [ ] Redis TTL 4 horas
- [ ] BD persiste historial

## Casos de Prueba

### Test 1: Happy Path
1. ✅ Profesor crea sala
2. ✅ 2 estudiantes se unen
3. ✅ Estudiantes marcan ready
4. ✅ Profesor inicia juego
5. ✅ Countdown se ejecuta
6. ✅ Juego se activa

### Test 2: Nickname Duplicado
1. ✅ Estudiante A se une como "Juan"
2. ❌ Estudiante B intenta unirse como "Juan"
3. ✅ Error: "Ese nickname ya está en uso"

### Test 3: Sala Llena
1. ✅ Crear sala con maxPlayers: 2
2. ✅ 2 estudiantes se unen
3. ❌ Estudiante 3 intenta unirse
4. ✅ Error: "La sala está llena"

### Test 4: Desconexión de Profesor (Lobby)
1. ✅ Profesor crea sala
2. ✅ Estudiantes se unen
3. ✅ Profesor se desconecta
4. ✅ Sala se cancela
5. ✅ Estudiantes reciben game:cancelled

### Test 5: Desconexión de Profesor (Activo)
1. ✅ Juego activo
2. ✅ Profesor se desconecta
3. ✅ Juego se pausa
4. ✅ Estudiantes reciben game:paused

### Test 6: Código Inválido
1. ❌ Intentar unirse a sala "XXXXXX"
2. ✅ Error: "Sala no encontrada"

### Test 7: Sin Autorización
1. ❌ Estudiante intenta iniciar juego
2. ✅ Error: "Solo el profesor puede iniciar"

## Logs Esperados

### Crear Sala
```
✅ Room created: A1B2C3 for quiz Mathematics Quiz
```

### Unirse
```
✅ Socket authenticated: user-uuid-123
🔌 Client connected: socket-abc-456 (User: user-uuid-123)
✅ Player Juan joined room A1B2C3
```

### Iniciar Juego
```
✅ Game starting in room A1B2C3
✅ Game activated in room A1B2C3
✅ Game started in room A1B2C3
```

### Desconexión
```
🔌 Socket disconnected: socket-abc-456 (Reason: client namespace disconnect)
✅ Player player-uuid-789 left room A1B2C3
```

## Troubleshooting

### Error: "Authentication error"
- Verifica que el token JWT sea válido
- Asegúrate de enviarlo en `socket.handshake.auth.token`

### Error: "Sala no encontrada"
- Verifica que el código sea correcto (6 caracteres)
- Revisa que la sala no haya expirado (4 horas)

### Error: "Quiz no encontrado"
- Verifica que el quiz_id exista en la BD
- Verifica que el quiz pertenezca al profesor

### Socket no conecta
- Verifica CORS en backend (debe incluir frontend origin)
- Verifica que el puerto 3001 esté libre
- Revisa firewall/antivirus

### Redis error
- Sistema funciona sin Redis (usa memoria)
- Para instalar Redis: ver INSTALL_SPRINT4.md

## Performance Benchmarks

Objetivos del Sprint 4:
- ✅ 50+ conexiones simultáneas sin lag
- ✅ Latencia WebSocket <50ms (p95)
- ✅ Join game <2 segundos
- ✅ Reconnect exitoso >95% casos

## Siguiente: Frontend

Una vez que el backend esté funcionando:
1. Implementar frontend con Socket.IO client
2. Páginas: JoinGame, Lobby, GamePlay
3. Conectar eventos WebSocket
4. UI con animaciones (Framer Motion)
5. Toast notifications (Sonner)

Ver: `frontend/SPRINT4_GUIDE.md` (pendiente de crear)
