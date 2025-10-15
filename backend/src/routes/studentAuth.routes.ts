import { Router } from 'express';
import { StudentAuthController } from '../controllers/studentAuth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  joinByCodeSchema,
  joinByQRSchema,
  joinByLinkSchema,
  registerPermanentSchema,
  loginPermanentSchema,
  loginByAvatarSchema,
  assignAvatarSchema,
} from '../schemas/studentAuth.schema';

const router = Router();
const studentAuthController = new StudentAuthController();

// ============================================
// MÉTODOS DE LOGIN ESTUDIANTES (SIN EMAIL)
// ============================================

// MÉTODO 1: Join por Código PIN
router.post(
  '/join-by-code',
  validateBody(joinByCodeSchema),
  studentAuthController.joinByCode
);

// MÉTODO 2: Join por QR Code
router.post(
  '/join-by-qr',
  validateBody(joinByQRSchema),
  studentAuthController.joinByQR
);

// MÉTODO 3: Join por Link Directo
router.post(
  '/join-by-link',
  validateBody(joinByLinkSchema),
  studentAuthController.joinByLink
);

// MÉTODO 4: Registro Permanente (Sin Email)
router.post(
  '/register-permanent',
  validateBody(registerPermanentSchema),
  studentAuthController.registerPermanent
);

// MÉTODO 4: Login Permanente (Usuario/Contraseña)
router.post(
  '/login-permanent',
  validateBody(loginPermanentSchema),
  studentAuthController.loginPermanent
);

// MÉTODO 5: Login por Avatar (Niños 3-6 años)
router.post(
  '/login-by-avatar',
  validateBody(loginByAvatarSchema),
  studentAuthController.loginByAvatar
);

// ============================================
// GESTIÓN DE AVATARES
// ============================================

// Obtener avatares de una clase (público para estudiantes)
router.get('/classes/:class_id/avatars', studentAuthController.getClassAvatars);

// Asignar avatar a estudiante (requiere auth de profesor)
router.post(
  '/classes/:class_id/avatars/:avatar_id/assign',
  authenticate,
  validateBody(assignAvatarSchema),
  studentAuthController.assignAvatar
);

// ============================================
// INFO DE JUEGOS (Para link directo)
// ============================================

// Obtener información del juego por código
router.get('/games/:game_code/info', studentAuthController.getGameInfo);

export default router;
