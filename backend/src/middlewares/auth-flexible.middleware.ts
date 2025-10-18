import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/database';

/**
 * Middleware de autenticación flexible que permite:
 * - Tokens JWT normales para profesores/admin
 * - Tokens temporales para estudiantes (temp_*)
 * - Acceso sin token (opcional para GET)
 */
export const authenticateFlexible = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Si no hay header de autorización
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Para rutas GET de lectura, permitir acceso sin token
      if (req.method === 'GET') {
        req.user = undefined;
        next();
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verificar si es un token temporal
    if (token.startsWith('temp_')) {
      // Token temporal para estudiantes
      // Validación básica del formato: temp_ROOMCODE_timestamp_random
      const parts = token.split('_');
      if (parts.length >= 4) {
        // Token temporal válido - crear usuario temporal
        req.user = {
          id: `temp-${parts[1]}-${Date.now()}`,
          username: 'estudiante_temp',
          rol: 'estudiante',
          estado: 'activo',
          isTemp: true,
          roomCode: parts[1]
        } as any;
        next();
        return;
      } else {
        // Token temporal mal formado
        res.status(401).json({
          success: false,
          message: 'Token temporal inválido',
        });
        return;
      }
    }

    // Intentar verificar como token JWT normal
    try {
      const payload = verifyAccessToken(token);

      // Buscar usuario
      const usuario = await prisma.usuarios.findUnique({
        where: { id: payload.userId },
      });

      if (!usuario || usuario.estado !== 'activo') {
        // Si no encuentra usuario pero es GET, permitir como anónimo
        if (req.method === 'GET') {
          req.user = undefined;
          next();
          return;
        }
        
        res.status(401).json({
          success: false,
          message: 'Usuario no autorizado',
        });
        return;
      }

      // Adjuntar usuario a request
      req.user = usuario;
      next();
    } catch (jwtError) {
      // Si falla JWT pero es método GET o parece ser un token mal formado, permitir acceso limitado
      if (req.method === 'GET' || token.length < 50) {
        // Token corto o inválido, probablemente temporal mal formado
        // Crear usuario temporal básico
        req.user = {
          id: `temp-${Date.now()}`,
          username: 'estudiante_temp',
          rol: 'estudiante',
          estado: 'activo',
          isTemp: true
        } as any;
        next();
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Error de autenticación',
    });
  }
};

/**
 * Middleware para verificar rol de admin/profesor
 * Debe usarse después de authenticateFlexible
 */
export const requireTeacherRole = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.isTemp) {
    res.status(403).json({
      success: false,
      message: 'Se requiere rol de profesor o administrador',
    });
    return;
  }

  if (req.user.rol !== 'admin' && req.user.rol !== 'profesor') {
    res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción',
    });
    return;
  }

  next();
};
