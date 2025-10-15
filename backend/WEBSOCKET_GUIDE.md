# WebSocket System Guide - Sprint 4

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente (Browser)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Teacher App   │  │  Student App 1 │  │  Student App N │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
└───────────┼──────────────────┼──────────────────┼─────────────┘
            │                  │                  │
            │  Socket.IO       │  Socket.IO      │  Socket.IO
            │  (WebSocket)     │  (WebSocket)    │  (WebSocket)
            │                  │                  │
┌───────────▼──────────────────▼──────────────────▼─────────────┐
│                     Socket.IO Server                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Authentication Middleware (JWT)                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Game Socket Handlers                             │ │
│  │  • game:join    • game:ready   • game:start             │ │
│  │  • game:leave   • disconnect   • game:close             │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                      RoomManager Service                        │
│  • createRoom()       • joinRoom()        • startGame()        │
│  • getRoomState()     • leaveRoom()       • closeRoom()        │
│  • togglePlayerReady() • broadcastToRoom()                     │
└────────┬─────────────────────────────────────────┬─────────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────────┐
│  PostgreSQL     │                      │  Redis (Cache)      │
│  • salas        │                      │  • room:{code}      │
│  • participantes│                      │  • TTL: 4 hours     │
└─────────────────┘                      └─────────────────────┘
```

## Flujo de Eventos

### 1. Crear Sala (REST)

```
Teacher App → POST /api/rooms
              ↓
         RoomManager.createRoom()
              ↓
         [DB] salas.create()
              ↓
         [Memory] rooms.set()
              ↓
         [Redis] room:{code}
              ↓
         Response: { roomCode, quizTitle, ... }
```

### 2. Unirse a Sala (WebSocket)

```
Student App → socket.emit('game:join', { roomCode, nickname })
              ↓
         Authenticate Socket (JWT)
              ↓
         RoomManager.joinRoom()
              ↓
         [DB] sala_participantes.create()
              ↓
         [Memory] room.players.push()
              ↓
         socket.join('game:ABC123')
              ↓
         Broadcast: 'player:joined' → All players
              ↓
         Emit: 'room:updated' → All players
              ↓
         Callback: { success, data: { room, playerId } }
```

### 3. Marcar Ready (WebSocket)

```
Student App → socket.emit('game:ready')
              ↓
         RoomManager.togglePlayerReady()
              ↓
         [DB] sala_participantes.update()
              ↓
         [Memory] player.isReady = !player.isReady
              ↓
         Broadcast: 'player:ready' → All players
              ↓
         Emit: 'room:updated' → All players
```

### 4. Iniciar Juego (WebSocket)

```
Teacher App → socket.emit('game:start', { roomCode })
              ↓
         Validate: isTeacher && hasPlayers
              ↓
         RoomManager.startGame()
              ↓
         [DB] salas.update({ estado: 'iniciando' })
              ↓
         Emit: 'game:starting' → All
              ↓
         Sleep 1s → Emit: 'game:countdown' { count: 3 }
              ↓
         Sleep 1s → Emit: 'game:countdown' { count: 2 }
              ↓
         Sleep 1s → Emit: 'game:countdown' { count: 1 }
              ↓
         Sleep 1s → Emit: 'game:countdown' { count: 0, message: '¡GO!' }
              ↓
         RoomManager.activateGame()
              ↓
         [DB] salas.update({ estado: 'activo' })
              ↓
         Emit: 'game:started' → All
```

### 5. Desconexión

```
Socket Disconnect
    ↓
Is Student?
    ↓ YES
RoomManager.leaveRoom()
    ↓
[DB] sala_participantes.update({ estado: 'desconectado' })
    ↓
Broadcast: 'player:disconnected' → All
    ↓
Emit: 'room:updated' → All

    ↓ Is Teacher?
        ↓ YES
    Status = 'lobby'?
        ↓ YES
    Emit: 'game:cancelled' → All
        ↓
    RoomManager.closeRoom()
        
    Status = 'active'?
        ↓ YES
    Emit: 'game:paused' → All
```

## Room State Management

### Estados de Sala

```typescript
type RoomStatus = 
  | 'lobby'      // Esperando jugadores
  | 'starting'   // Countdown 3-2-1
  | 'active'     // Juego en curso
  | 'paused'     // Pausado (profesor desconectado)
  | 'finished';  // Finalizado
```

### Ciclo de Vida de una Sala

```
[CREATE] → lobby → [START] → starting → active → [END] → finished
                      ↓          ↓
                   [CANCEL]   [PAUSE]
                      ↓          ↓
                   finished   paused → [RESUME] → active
```

### Estructura RoomState

```typescript
interface RoomState {
  roomCode: string;           // 'ABC123'
  quizId: string;             // UUID del quiz
  quizTitle: string;          // 'Mathematics Quiz'
  teacherId: string;          // UUID del profesor
  teacherName: string;        // 'Prof. García'
  status: RoomStatus;         // 'lobby' | 'starting' | etc
  players: PlayerInfo[];      // Lista de jugadores
  config: GameConfig;         // Configuración
  createdAt: Date;            // Timestamp creación
  startedAt?: Date;           // Timestamp inicio
}

interface PlayerInfo {
  id: string;                 // UUID sala_participante
  userId?: string;            // UUID usuario (si registrado)
  nickname: string;           // 'Juan123'
  avatar: string;             // '😎' emoji
  isReady: boolean;           // true si marcó ready
  isConnected: boolean;       // true si socket conectado
  joinedAt: Date;             // Timestamp unión
}
```

## Sincronización de Datos

### Triple Storage Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Memory (Map)                                      │
│  • Ultra-fast access (O(1))                                 │
│  • Lost on server restart                                   │
│  • Primary source during runtime                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Backup
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Redis (Cache)                                     │
│  • Fast access (~1ms)                                       │
│  • TTL: 4 hours                                             │
│  • Survives server restart                                  │
│  • Optional (system works without it)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Persist
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: PostgreSQL (Database)                             │
│  • Permanent storage                                        │
│  • Source of truth                                          │
│  • Used for recovery & analytics                            │
└─────────────────────────────────────────────────────────────┘
```

### Estrategia de Lectura

```typescript
async getRoomState(roomCode: string) {
  // 1. Try Memory
  let room = this.rooms.get(roomCode);
  if (room) return room;

  // 2. Try Redis
  const cached = await redis.get(`room:${roomCode}`);
  if (cached) {
    room = JSON.parse(cached);
    this.rooms.set(roomCode, room);
    return room;
  }

  // 3. Try Database
  const sala = await prisma.salas.findUnique(...);
  if (sala) {
    room = reconstructRoomState(sala);
    this.rooms.set(roomCode, room);
    await redis.set(`room:${roomCode}`, JSON.stringify(room));
    return room;
  }

  return null;
}
```

### Estrategia de Escritura

```typescript
async updateRoom(roomCode: string, room: RoomState) {
  // 1. Update Memory
  this.rooms.set(roomCode, room);

  // 2. Update Redis (async, don't await)
  redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 14400);

  // 3. Update Database (critical changes only)
  await prisma.salas.update(...);
}
```

## Seguridad

### Autenticación WebSocket

```typescript
io.use(async (socket, next) => {
  // 1. Extraer token
  const token = socket.handshake.auth.token;

  // 2. Verificar JWT
  const payload = verifyAccessToken(token);

  // 3. Adjuntar al socket
  socket.userId = payload.userId;
  socket.userRole = payload.role;

  next();
});
```

### Autorización de Acciones

```typescript
// Solo el profesor puede iniciar
if (room.teacherId !== socket.userId) {
  throw new Error('Solo el profesor puede iniciar');
}

// Solo el profesor puede cerrar
if (room.teacherId !== socket.userId) {
  throw new Error('Solo el profesor puede cerrar');
}
```

### Validaciones

```typescript
// Sala en estado correcto
if (room.status !== 'lobby') {
  throw new Error('La sala ya ha iniciado');
}

// Límite de jugadores
if (room.players.length >= room.config.maxPlayers) {
  throw new Error('La sala está llena');
}

// Nickname único
if (room.players.some(p => p.nickname === nickname)) {
  throw new Error('Ese nickname ya está en uso');
}
```

## Socket Rooms

### Namespace Strategy

```
Usamos el namespace por defecto: '/'
```

### Room Naming

```typescript
// Patrón: 'game:{roomCode}'
socket.join('game:ABC123');

// Broadcast a todos en la sala
io.to('game:ABC123').emit('player:joined', data);

// Broadcast a todos excepto el sender
socket.to('game:ABC123').emit('player:joined', data);
```

### Room Operations

```typescript
// Unirse
await socket.join(`game:${roomCode}`);

// Salir
await socket.leave(`game:${roomCode}`);

// Obtener todos los sockets en room
const sockets = await io.in(`game:${roomCode}`).fetchSockets();

// Desconectar todos
for (const socket of sockets) {
  socket.disconnect();
}
```

## Error Handling

### Callback Pattern

```typescript
socket.emit('game:join', payload, (response) => {
  if (response.success) {
    // Handle success
    console.log(response.data);
  } else {
    // Handle error
    console.error(response.message);
  }
});
```

### Server-side Error Handling

```typescript
socket.on('game:join', async (payload, callback) => {
  try {
    // Logic here
    callback?.({
      success: true,
      data: { room, playerId }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    callback?.({
      success: false,
      message: error.message || 'Error al unirse'
    });
  }
});
```

## Performance Considerations

### Broadcast Optimization

```typescript
// ❌ Bad: Individual emits
for (const player of room.players) {
  socket.to(player.socketId).emit('update', data);
}

// ✅ Good: Room broadcast
io.to(`game:${roomCode}`).emit('room:updated', data);
```

### Payload Size

```typescript
// ❌ Bad: Send full room state every time
io.emit('update', fullRoomState); // Large payload

// ✅ Good: Send only what changed
io.emit('player:ready', { playerId, isReady }); // Small payload
```

### Memory Management

```typescript
// Cleanup on room close
this.rooms.delete(roomCode);
await redis.del(`room:${roomCode}`);

// Cleanup on disconnect
delete socket.playerId;
delete socket.currentRoom;
```

## Monitoring & Debugging

### Logs

```typescript
console.log(`✅ Room created: ${roomCode}`);
console.log(`✅ Player ${nickname} joined room ${roomCode}`);
console.log(`🔌 Client connected: ${socket.id}`);
console.log(`🔌 Client disconnected: ${socket.id}`);
```

### Socket.IO Admin UI (Optional)

```bash
npm install @socket.io/admin-ui

# En socket.ts
import { instrument } from '@socket.io/admin-ui';
instrument(io, { auth: false });

# Visitar: https://admin.socket.io/
```

## Testing

### Unit Test Example

```typescript
describe('RoomManager', () => {
  it('should create room with unique code', async () => {
    const room = await roomManager.createRoom(quizId, teacherId);
    expect(room.roomCode).toHaveLength(6);
  });

  it('should reject duplicate nicknames', async () => {
    await roomManager.joinRoom(code, null, 'Juan', '😎');
    await expect(
      roomManager.joinRoom(code, null, 'Juan', '🎮')
    ).rejects.toThrow('Ese nickname ya está en uso');
  });
});
```

### Integration Test Example

```typescript
describe('WebSocket Events', () => {
  let clientSocket;

  beforeAll((done) => {
    clientSocket = io('http://localhost:3001', {
      auth: { token: testToken }
    });
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.disconnect();
  });

  it('should join game successfully', (done) => {
    clientSocket.emit('game:join', {
      roomCode: 'TEST01',
      nickname: 'TestUser'
    }, (response) => {
      expect(response.success).toBe(true);
      expect(response.data.playerId).toBeDefined();
      done();
    });
  });
});
```

## Best Practices

### ✅ Do's

- Use callbacks for acknowledgments
- Validate all inputs server-side
- Clean up on disconnect
- Use typed payloads (TypeScript)
- Log important events
- Handle errors gracefully
- Use rooms for targeted broadcasts
- Keep payloads small

### ❌ Don'ts

- Don't trust client data
- Don't store sensitive data in client
- Don't broadcast to everyone unnecessarily
- Don't forget to clean up resources
- Don't use polling instead of WebSocket
- Don't send large payloads frequently
- Don't forget error handling
- Don't hardcode room names

## Troubleshooting

### Issue: Socket not connecting

```typescript
// Check CORS
cors: {
  origin: 'http://localhost:5173', // Must match frontend
  credentials: true
}

// Check client connection
const socket = io('http://localhost:3001', {
  auth: { token }
});
```

### Issue: Events not received

```typescript
// Server: Make sure to emit
io.to(`game:${roomCode}`).emit('event', data);

// Client: Make sure to listen
socket.on('event', (data) => {
  console.log(data);
});
```

### Issue: Memory leak

```typescript
// Always cleanup
socket.on('disconnect', async () => {
  await cleanup();
  socket.removeAllListeners();
});
```

## Redis (Optional but Recommended)

### Why Redis?

- **Horizontal Scaling**: Multiple server instances share state
- **Fast**: Sub-millisecond access
- **Persistence**: Survives server restart
- **TTL**: Auto-cleanup of expired rooms

### When to Use Redis?

- Production environment
- Multiple server instances (load balancing)
- High traffic (100+ concurrent users)

### When NOT to Use Redis?

- Development (single instance)
- Low traffic (<50 users)
- Limited resources

## Next Steps (Sprint 5)

- [ ] Implement question sending
- [ ] Implement answer submission
- [ ] Real-time leaderboard
- [ ] Timer management
- [ ] Combo/streak system
- [ ] Power-ups
- [ ] Analytics & reporting
