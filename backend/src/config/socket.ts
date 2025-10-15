import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedSocket } from '../types/socket.types';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis adapter para escalabilidad (opcional - descomentar cuando se necesite)
  // Para habilitar Redis adapter:
  // 1. npm install @socket.io/redis-adapter
  // 2. Descomentar el código siguiente:
  /*
  if (process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis');
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = new Redis(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter configured');
    } catch (error) {
      console.warn('⚠️  Redis adapter not configured, using memory adapter');
    }
  }
  */

  // Middleware de autenticación para WebSocket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Permitir tokens temporales anónimos
      if (token.startsWith('temp_')) {
        socket.userId = token; // Usar el token temporal como userId
        socket.userRole = 'estudiante';
        console.log(`✅ Socket authenticated (anonymous): ${token.substring(0, 20)}...`);
        return next();
      }

      // Verificar JWT para tokens reales
      const payload = verifyAccessToken(token);

      // Adjuntar datos al socket
      socket.userId = payload.userId;
      socket.userRole = payload.role;

      console.log(`✅ Socket authenticated: ${socket.userId}`);
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Log de conexiones
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId})`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

export default setupSocketIO;
