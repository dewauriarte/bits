import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import studentAuthRoutes from './routes/studentAuth.routes';
import classRoutes from './routes/class.routes';
import catalogRoutes from './routes/catalog.routes';
import quizRoutes from './routes/quiz.routes';
import aiConfigRoutes from './routes/aiConfig.routes';
import aiRoutes from './routes/ai.routes';
import roomRoutes from './routes/room.routes';
import boardsRoutes from './routes/boards.routes';
import { setupSocketIO } from './config/socket';
import { setupGameSocketHandlers } from './sockets/game.socket';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());

// CORS configurado correctamente para withCredentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('dev'));
// Aumentar límite para soportar imágenes base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    message: 'AppQuiz API v1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
    },
    docs: 'Use POST requests para /api/auth endpoints'
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/student', studentAuthRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/boards', boardsRoutes);

// Ruta especial para estudiantes ver sus clases
app.use('/api/students', classRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

// Configurar Socket.IO
const io = setupSocketIO(httpServer);
setupGameSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
