import { Request, Response } from 'express';
import roomManager from '../services/room.service';
import prisma from '../config/database';

/**
 * POST /api/rooms
 * Crear una nueva sala de juego
 */
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quiz_id, config_juego, modo_acceso, clase_id } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    if (!quiz_id) {
      res.status(400).json({
        success: false,
        message: 'quiz_id es requerido',
      });
      return;
    }

    // Validar que si es modo cerrado, debe tener clase_id
    if (modo_acceso === 'cerrado' && !clase_id) {
      res.status(400).json({
        success: false,
        message: 'clase_id es requerido para salas cerradas',
      });
      return;
    }

    // Verificar que el quiz existe y pertenece al profesor
    const quiz = await prisma.quizzes.findFirst({
      where: {
        id: quiz_id,
        creador_id: teacherId,
      },
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz no encontrado o no tienes permisos',
      });
      return;
    }

    // Verificar que la clase existe y pertenece al profesor si es modo cerrado
    if (modo_acceso === 'cerrado' && clase_id) {
      const clase = await prisma.clases.findFirst({
        where: {
          id: clase_id,
          profesor_id: teacherId,
        },
      });

      if (!clase) {
        res.status(404).json({
          success: false,
          message: 'Clase no encontrada o no tienes permisos',
        });
        return;
      }
    }

    // Crear sala
    const room = await roomManager.createRoom(
      quiz_id,
      teacherId,
      config_juego || {},
      modo_acceso || 'libre',
      clase_id
    );

    res.status(201).json({
      success: true,
      data: {
        room,
        join_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/game/join?code=${room.roomCode}`,
      },
      message: 'Sala creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la sala',
    });
  }
};

/**
 * GET /api/rooms/:code
 * Obtener información pública de una sala
 */
export const getRoomInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const room = await roomManager.getRoomState(code);

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Sala no encontrada',
      });
      return;
    }

    // Obtener avatares ya usados por jugadores conectados
    const usedAvatars = room.players
      .filter((p) => p.isConnected)
      .map((p) => p.avatar);

    // Información pública (sin datos sensibles)
    res.json({
      success: true,
      data: {
        roomCode: room.roomCode,
        quizTitle: room.quizTitle,
        teacherName: room.teacherName,
        status: room.status,
        playerCount: room.players.filter((p) => p.isConnected).length,
        maxPlayers: room.config.maxPlayers,
        allowLateJoin: room.config.allowLateJoin,
        usedAvatars, // Lista de avatares ya en uso
      },
    });
  } catch (error: any) {
    console.error('Error getting room info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener información de la sala',
    });
  }
};

/**
 * GET /api/rooms/:code/full
 * Obtener estado completo de una sala (solo profesor)
 */
export const getRoomFullState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const userId = req.user?.id;

    const room = await roomManager.getRoomState(code);

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Sala no encontrada',
      });
      return;
    }

    // Verificar que es el profesor
    if (room.teacherId !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta información',
      });
      return;
    }

    res.json({
      success: true,
      data: { room },
    });
  } catch (error: any) {
    console.error('Error getting room full state:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estado de la sala',
    });
  }
};

/**
 * POST /api/rooms/:code/start
 * Iniciar el juego (solo profesor) - Alternativa REST
 */
export const startGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    await roomManager.startGame(code, teacherId);

    res.json({
      success: true,
      message: 'Juego iniciado',
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al iniciar el juego',
    });
  }
};

/**
 * DELETE /api/rooms/:code
 * Cerrar sala (solo profesor)
 */
export const closeRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    await roomManager.closeRoom(code, teacherId);

    res.json({
      success: true,
      message: 'Sala cerrada exitosamente',
    });
  } catch (error: any) {
    console.error('Error closing room:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cerrar la sala',
    });
  }
};

/**
 * GET /api/rooms/:code/students
 * Obtener estudiantes pre-cargados de una sala privada
 */
export const getRoomStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    // Buscar sala en BD
    const sala = await prisma.salas.findUnique({
      where: { codigo: code },
      select: {
        id: true,
        modo_acceso: true,
        estado: true,
      },
    });

    if (!sala) {
      res.status(404).json({
        success: false,
        message: 'Sala no encontrada',
      });
      return;
    }

    // Solo para salas cerradas
    if (sala.modo_acceso !== 'cerrado') {
      res.status(400).json({
        success: false,
        message: 'Esta sala no es cerrada',
      });
      return;
    }

    // Obtener participantes pre-cargados (desconectados y conectados)
    const participantes = await prisma.sala_participantes.findMany({
      where: { sala_id: sala.id },
      select: {
        id: true,
        usuario_id: true,
        nickname: true,
        avatar: true,
        estado: true,
      },
      orderBy: { nickname: 'asc' },
    });

    // Filtrar solo los disponibles (desconectados) para mostrar en lista
    const availableStudents = participantes.filter(p => p.estado === 'desconectado');
    
    res.json({
      success: true,
      data: {
        students: availableStudents.map(p => ({
          id: p.id,
          userId: p.usuario_id,
          nickname: p.nickname,
          avatar: p.avatar,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error getting room students:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estudiantes',
    });
  }
};

/**
 * GET /api/rooms/teacher/active
 * Obtener salas activas del profesor
 */
export const getTeacherActiveRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    const salas = await prisma.salas.findMany({
      where: {
        profesor_id: teacherId,
        estado: {
          in: ['esperando', 'iniciando', 'activo', 'pausado'],
        },
      },
      include: {
        quizzes: {
          select: { titulo: true },
        },
        sala_participantes: {
          where: {
            estado: {
              in: ['conectado', 'listo'],
            },
          },
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        rooms: salas.map((s) => ({
          roomCode: s.codigo,
          quizTitle: s.quizzes?.titulo,
          status: s.estado,
          playerCount: s.sala_participantes.length,
          createdAt: s.fecha_creacion,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error getting teacher rooms:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener salas',
    });
  }
};
