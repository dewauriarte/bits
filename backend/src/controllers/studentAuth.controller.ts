import { Request, Response } from 'express';
import { StudentAuthService } from '../services/studentAuth.service';
import {
  JoinByCodeInput,
  JoinByQRInput,
  JoinByLinkInput,
  RegisterPermanentInput,
  LoginPermanentInput,
  LoginByAvatarInput,
  AssignAvatarInput,
} from '../schemas/studentAuth.schema';

const studentAuthService = new StudentAuthService();

export class StudentAuthController {
  /**
   * MÉTODO 1: Join por Código PIN
   * POST /api/auth/student/join-by-code
   */
  async joinByCode(req: Request<{}, {}, JoinByCodeInput>, res: Response) {
    try {
      const result = await studentAuthService.joinByCode(req.body);

      res.status(200).json({
        success: true,
        message: 'Unido al juego exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al unirse al juego',
      });
    }
  }

  /**
   * MÉTODO 2: Join por QR Code
   * POST /api/auth/student/join-by-qr
   */
  async joinByQR(req: Request<{}, {}, JoinByQRInput>, res: Response) {
    try {
      const result = await studentAuthService.joinByQR(req.body);

      res.status(200).json({
        success: true,
        message: 'QR escaneado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al escanear QR',
      });
    }
  }

  /**
   * MÉTODO 3: Join por Link Directo
   * POST /api/auth/student/join-by-link
   */
  async joinByLink(req: Request<{}, {}, JoinByLinkInput>, res: Response) {
    try {
      const result = await studentAuthService.joinByLink(req.body);

      res.status(200).json({
        success: true,
        message: 'Unido al juego exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al unirse al juego',
      });
    }
  }

  /**
   * MÉTODO 4: Registro Permanente (Sin Email)
   * POST /api/auth/student/register-permanent
   */
  async registerPermanent(req: Request<{}, {}, RegisterPermanentInput>, res: Response) {
    try {
      const result = await studentAuthService.registerPermanent(req.body);

      res.status(201).json({
        success: true,
        message: '¡Cuenta creada exitosamente! Ahora puedes guardar tu progreso',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear cuenta',
      });
    }
  }

  /**
   * MÉTODO 4: Login Permanente
   * POST /api/auth/student/login-permanent
   */
  async loginPermanent(req: Request<{}, {}, LoginPermanentInput>, res: Response) {
    try {
      const result = await studentAuthService.loginPermanent(req.body);

      res.status(200).json({
        success: true,
        message: `¡Bienvenido de nuevo, ${result.user.nombre}!`,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      });
    }
  }

  /**
   * MÉTODO 5: Login por Avatar (Niños 3-6 años)
   * POST /api/auth/student/login-by-avatar
   */
  async loginByAvatar(req: Request<{}, {}, LoginByAvatarInput>, res: Response) {
    try {
      const result = await studentAuthService.loginByAvatar(req.body);

      res.status(200).json({
        success: true,
        message: `¡Hola ${result.user.nombre}! 👋`,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      });
    }
  }

  /**
   * Obtener avatares de una clase
   * GET /api/classes/:class_id/avatars
   */
  async getClassAvatars(req: Request<{ class_id: string }>, res: Response) {
    try {
      const result = await studentAuthService.getClassAvatars(req.params.class_id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener avatares',
      });
    }
  }

  /**
   * Asignar avatar a estudiante (Profesor)
   * POST /api/classes/:class_id/avatars/:avatar_id/assign
   */
  async assignAvatar(
    req: Request<{ class_id: string; avatar_id: string }, {}, AssignAvatarInput>,
    res: Response
  ) {
    try {
      const result = await studentAuthService.assignAvatar(
        req.params.class_id,
        req.params.avatar_id,
        req.body.estudiante_id
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al asignar avatar',
      });
    }
  }

  /**
   * Obtener info del juego por código (Para link directo)
   * GET /api/games/:game_code/info
   */
  async getGameInfo(req: Request<{ game_code: string }>, res: Response) {
    try {
      const result = await studentAuthService.getGameInfo(req.params.game_code);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener información del juego',
      });
    }
  }
}
