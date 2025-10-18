import { Router } from 'express';
import BoardsController from '../controllers/boards.controller';
import { authenticateFlexible, requireTeacherRole } from '../middlewares/auth-flexible.middleware';

const router = Router();

// Rutas de lectura - permiten tokens temporales y acceso anónimo
router.get('/', authenticateFlexible, BoardsController.getBoards);
router.get('/:id', authenticateFlexible, BoardsController.getBoardById);

// Rutas de admin (requieren rol de admin/profesor)
router.post('/', authenticateFlexible, requireTeacherRole, BoardsController.createBoard);
router.put('/:id', authenticateFlexible, requireTeacherRole, BoardsController.updateBoard);
router.delete('/:id', authenticateFlexible, requireTeacherRole, BoardsController.deleteBoard);

export default router;
