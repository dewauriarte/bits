import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../schemas/auth.schema';

const authService = new AuthService();

export class AuthController {
  async register(req: Request<{}, {}, RegisterInput>, res: Response) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al registrar usuario',
      });
    }
  }

  async login(req: Request<{}, {}, LoginInput>, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      });
    }
  }

  async refresh(req: Request<{}, {}, RefreshTokenInput>, res: Response) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al refrescar token',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
        return;
      }

      const result = await authService.logout(req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al cerrar sesión',
      });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
        return;
      }

      const result = await authService.getMe(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user: result,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuario',
      });
    }
  }
}
