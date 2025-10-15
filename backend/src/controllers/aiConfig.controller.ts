import { Request, Response } from 'express';
import { AIConfigService } from '../services/aiConfig.service';
import { AVAILABLE_MODELS, PROVIDER_INFO } from '../schemas/aiConfig.schema';

const aiConfigService = new AIConfigService();

export class AIConfigController {
  // GET /api/ai-config - Obtener configuración del usuario
  async getConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const config = await aiConfigService.getUserAIConfig(userId);

      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener configuración',
      });
    }
  }

  // POST /api/ai-config - Crear/actualizar configuración
  async setConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const config = await aiConfigService.setUserAIConfig(userId, data);

      res.json({
        success: true,
        message: 'Configuración guardada exitosamente',
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al guardar configuración',
      });
    }
  }

  // PATCH /api/ai-config - Actualizar parcialmente
  async updateConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const config = await aiConfigService.updateUserAIConfig(userId, data);

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar configuración',
      });
    }
  }

  // DELETE /api/ai-config - Eliminar configuración
  async deleteConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      await aiConfigService.deleteUserAIConfig(userId);

      res.json({
        success: true,
        message: 'Configuración eliminada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar configuración',
      });
    }
  }

  // POST /api/ai-config/test - Probar conexión
  async testConnection(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await aiConfigService.testAIConnection(data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al probar conexión',
      });
    }
  }

  // GET /api/ai-config/models - Listar modelos disponibles
  async getAvailableModels(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          models: AVAILABLE_MODELS,
          providers: PROVIDER_INFO,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener modelos',
      });
    }
  }
}
