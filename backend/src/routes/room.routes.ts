import { Router } from 'express';
import {
  createRoom,
  getRoomInfo,
  getRoomFullState,
  getRoomStudents,
  startGame,
  closeRoom,
  getTeacherActiveRooms,
} from '../controllers/room.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (no requieren auth)
router.get('/:code', getRoomInfo);
router.get('/:code/students', getRoomStudents); // Lista de estudiantes para salas privadas

// Rutas de profesor (requieren auth)
router.post('/', authenticate, authorize('profesor'), createRoom);
router.get('/:code/full', authenticate, getRoomFullState);
router.post('/:code/start', authenticate, authorize('profesor'), startGame);
router.delete('/:code', authenticate, authorize('profesor'), closeRoom);
router.get('/teacher/active', authenticate, authorize('profesor'), getTeacherActiveRooms);

export default router;
