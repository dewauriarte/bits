import prisma from '../config/database';
import { AIConfigInput, UpdateAIConfigInput, getBestModel } from '../schemas/aiConfig.schema';

export class AIConfigService {
  /**
   * Obtener configuración de IA del usuario (para uso interno - incluye API key)
   */
  async getUserAIConfigInternal(userId: string) {
    const config = await prisma.configuracion_sistema.findFirst({
      where: {
        clave: `ai_config_${userId}`,
      },
    });

    if (!config) {
      return null;
    }

    const aiConfig = config.valor as any;
    
    return {
      id: config.id,
      ...aiConfig,
      fecha_actualizacion: config.fecha_actualizacion,
    };
  }

  /**
   * Obtener configuración de IA del usuario (para frontend - sin API key)
   */
  async getUserAIConfig(userId: string) {
    const config = await this.getUserAIConfigInternal(userId);

    if (!config) {
      return null;
    }

    // Ocultar parcialmente la API key por seguridad
    if (config.api_key) {
      config.api_key_masked = this.maskApiKey(config.api_key);
      config.has_api_key = true;
      delete config.api_key; // No enviar la key completa al frontend
    }

    return config;
  }

  /**
   * Crear o actualizar configuración de IA
   */
  async setUserAIConfig(userId: string, data: AIConfigInput) {
    const clave = `ai_config_${userId}`;

    // Verificar si ya existe
    const existing = await prisma.configuracion_sistema.findFirst({
      where: { clave },
    });

    // Obtener automáticamente el mejor modelo para el proveedor
    const bestModel = getBestModel(data.provider);
    
    const configData = {
      provider: data.provider,
      model: bestModel,
      api_key: data.api_key,
      is_active: data.is_active ?? true,
    };

    if (existing) {
      // Actualizar
      const updated = await prisma.configuracion_sistema.update({
        where: { id: existing.id },
        data: {
          valor: configData as any,
          fecha_actualizacion: new Date(),
        },
      });

      return this.formatResponse(updated);
    } else {
      // Crear
      const created = await prisma.configuracion_sistema.create({
        data: {
          clave,
          valor: configData as any,
          descripcion: `Configuración de IA para usuario ${userId}`,
        },
      });

      return this.formatResponse(created);
    }
  }

  /**
   * Actualizar configuración parcialmente
   */
  async updateUserAIConfig(userId: string, data: UpdateAIConfigInput) {
    const clave = `ai_config_${userId}`;

    const existing = await prisma.configuracion_sistema.findFirst({
      where: { clave },
    });

    if (!existing) {
      throw new Error('No tienes una configuración de IA. Créala primero.');
    }

    const currentConfig = existing.valor as any;
    
    // Si cambia el proveedor, actualizar el modelo automáticamente
    const newModel = data.provider && data.provider !== currentConfig.provider
      ? getBestModel(data.provider)
      : currentConfig.model;
    
    const newConfig = {
      ...currentConfig,
      ...data,
      model: newModel,
    };

    const updated = await prisma.configuracion_sistema.update({
      where: { id: existing.id },
      data: {
        valor: newConfig as any,
        fecha_actualizacion: new Date(),
      },
    });

    return this.formatResponse(updated);
  }

  /**
   * Eliminar configuración de IA
   */
  async deleteUserAIConfig(userId: string) {
    const clave = `ai_config_${userId}`;

    const existing = await prisma.configuracion_sistema.findFirst({
      where: { clave },
    });

    if (!existing) {
      throw new Error('No tienes una configuración de IA');
    }

    await prisma.configuracion_sistema.delete({
      where: { id: existing.id },
    });

    return { message: 'Configuración eliminada exitosamente' };
  }

  /**
   * Probar conexión con API (sin guardar)
   */
  async testAIConnection(data: AIConfigInput) {
    try {
      // TODO: Implementar test real según el proveedor
      // Por ahora solo validamos que la key no esté vacía
      if (!data.api_key || data.api_key.length < 10) {
        throw new Error('API Key inválida');
      }

      return {
        success: true,
        message: 'Conexión exitosa',
        provider: data.provider,
        model: data.model,
      };
    } catch (error: any) {
      throw new Error(`Error al probar conexión: ${error.message}`);
    }
  }

  /**
   * Obtener configuración activa para generar quizzes (con API key completa)
   * SOLO para uso interno del servidor
   */
  async getActiveAIConfigForGeneration(userId: string) {
    const config = await prisma.configuracion_sistema.findFirst({
      where: {
        clave: `ai_config_${userId}`,
      },
    });

    if (!config) {
      throw new Error('No tienes configurada ninguna API de IA. Configúrala en Configuración.');
    }

    const aiConfig = config.valor as any;

    if (!aiConfig.is_active) {
      throw new Error('Tu configuración de IA está desactivada');
    }

    if (!aiConfig.api_key) {
      throw new Error('API Key no configurada');
    }

    return {
      provider: aiConfig.provider,
      model: aiConfig.model,
      api_key: aiConfig.api_key,
    };
  }

  /**
   * Formatear respuesta ocultando API key
   */
  private formatResponse(config: any) {
    const aiConfig = config.valor as any;
    
    if (aiConfig.api_key) {
      aiConfig.api_key_masked = this.maskApiKey(aiConfig.api_key);
      aiConfig.has_api_key = true;
      delete aiConfig.api_key;
    }

    return {
      id: config.id,
      ...aiConfig,
      fecha_actualizacion: config.fecha_actualizacion,
    };
  }

  /**
   * Ocultar API key mostrando solo primeros y últimos caracteres
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 12) {
      return '***' + apiKey.slice(-4);
    }
    return apiKey.slice(0, 8) + '...' + apiKey.slice(-4);
  }
}
