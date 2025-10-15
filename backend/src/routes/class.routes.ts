import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createClassSchema,
  updateClassSchema,
  joinClassSchema,
  getClassesQuerySchema,
} from '../schemas/class.schema';

const router = Router();
const classController = new ClassController();

// Ruta pública - Descargar plantilla (no requiere auth)
router.get('/template/download', classController.downloadTemplate.bind(classController));

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/classes - Listar clases del profesor
router.get(
  '/',
  validateQuery(getClassesQuerySchema),
  classController.getClasses.bind(classController)
);

// POST /api/classes - Crear nueva clase
router.post(
  '/',
  validateBody(createClassSchema),
  classController.createClass.bind(classController)
);

// POST /api/classes/join - Unirse a clase (estudiantes)
router.post(
  '/join',
  validateBody(joinClassSchema),
  classController.joinClass.bind(classController)
);

// GET /api/students/classes - Listar clases del estudiante (debe estar ANTES de /:id)
router.get('/classes', classController.getStudentClasses.bind(classController));

// GET /api/classes/:id - Detalle de clase
router.get('/:id', classController.getClassById.bind(classController));

// PUT /api/classes/:id - Actualizar clase
router.put(
  '/:id',
  validateBody(updateClassSchema),
  classController.updateClass.bind(classController)
);

// DELETE /api/classes/:id - Archivar clase
router.delete('/:id', classController.deleteClass.bind(classController));

// GET /api/classes/:id/students - Listar estudiantes de la clase
router.get('/:id/students', classController.getClassStudents.bind(classController));

// DELETE /api/classes/:id/students/:studentId - Remover estudiante
router.delete('/:id/students/:studentId', classController.removeStudent.bind(classController));

// GET /api/classes/:id/stats - Estadísticas de la clase
router.get('/:id/stats', classController.getClassStats.bind(classController));

// POST /api/classes/:id/import-students - Importar estudiantes desde Excel
router.post('/:id/import-students', classController.importStudents.bind(classController));

// POST /api/classes/:id/add-student - Agregar estudiante existente a clase
router.post('/:id/add-student', classController.addExistingStudent.bind(classController));

// POST /api/classes/:id/create-student - Crear nuevo estudiante y agregar a clase
router.post('/:id/create-student', classController.createStudent.bind(classController));

// GET /api/students/search-one/:username - Buscar estudiante específico por username
router.get('/students/search-one/:username', classController.searchStudent.bind(classController));

// GET /api/students/search - Buscar estudiantes (autocompletado) - DEBE IR DESPUÉS
router.get('/students/search', classController.searchStudents.bind(classController));

export default router;
