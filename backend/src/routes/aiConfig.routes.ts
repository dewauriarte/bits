import { Router } from 'express';
import { AIConfigController } from '../controllers/aiConfig.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { aiConfigSchema, updateAIConfigSchema } from '../schemas/aiConfig.schema';

const router = Router();
const aiConfigController = new AIConfigController();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/ai-config/models - Listar modelos disponibles (público para usuarios autenticados)
router.get('/models', aiConfigController.getAvailableModels.bind(aiConfigController));

// GET /api/ai-config - Obtener configuración del usuario
router.get('/', aiConfigController.getConfig.bind(aiConfigController));

// POST /api/ai-config - Crear/actualizar configuración completa
router.post(
  '/',
  validateBody(aiConfigSchema),
  aiConfigController.setConfig.bind(aiConfigController)
);

// PATCH /api/ai-config - Actualizar parcialmente
router.patch(
  '/',
  validateBody(updateAIConfigSchema),
  aiConfigController.updateConfig.bind(aiConfigController)
);

// DELETE /api/ai-config - Eliminar configuración
router.delete('/', aiConfigController.deleteConfig.bind(aiConfigController));

// POST /api/ai-config/test - Probar conexión (no guarda)
router.post(
  '/test',
  validateBody(aiConfigSchema),
  aiConfigController.testConnection.bind(aiConfigController)
);

export default router;
