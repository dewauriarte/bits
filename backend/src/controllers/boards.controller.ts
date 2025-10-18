import { Request, Response } from 'express';
import prisma from '../config/database';
import { CasillaType } from '../services/mario-party.service';

interface Casilla {
  posicion: number;
  tipo: CasillaType;
  nombre?: string;
  descripcion?: string;
  color?: string;
}

export class BoardsController {
  /**
   * Obtener todos los tableros activos
   */
  static async getBoards(_req: Request, res: Response) {
    try {
      const boards = await prisma.tableros.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombre: true,
          tema: true,
          total_casillas: true,
          imagen_preview: true,
          posiciones_estrellas: true,
          fecha_creacion: true
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      return res.json({
        success: true,
        data: boards
      });
    } catch (error: any) {
      console.error('Error getting boards:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tableros',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tablero por ID
   */
  static async getBoardById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const board = await prisma.tableros.findUnique({
        where: { id }
      });

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Tablero no encontrado'
        });
      }

      return res.json({
        success: true,
        data: board
      });
    } catch (error: any) {
      console.error('Error getting board:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tablero',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo tablero (admin only)
   */
  static async createBoard(req: Request, res: Response) {
    try {
      const { 
        nombre, 
        tema, 
        total_casillas,
        config_casillas,
        imagen_preview,
        posiciones_estrellas 
      } = req.body;

      // Validar que config_casillas tenga estructura correcta
      if (!Array.isArray(config_casillas)) {
        return res.status(400).json({
          success: false,
          message: 'config_casillas debe ser un array'
        });
      }

      // Validar que todas las posiciones estén cubiertas
      if (config_casillas.length !== total_casillas) {
        return res.status(400).json({
          success: false,
          message: 'El número de casillas configuradas debe coincidir con total_casillas'
        });
      }

      // Validar estructura de cada casilla
      for (const casilla of config_casillas) {
        if (!casilla.posicion || !casilla.tipo) {
          return res.status(400).json({
            success: false,
            message: 'Cada casilla debe tener posicion y tipo'
          });
        }
      }

      const board = await prisma.tableros.create({
        data: {
          nombre,
          tema: tema || 'default',
          total_casillas,
          config_casillas,
          imagen_preview,
          posiciones_estrellas: posiciones_estrellas || [13, 26],
          activo: true
        }
      });

      res.status(201).json({
        success: true,
        data: board,
        message: 'Tablero creado exitosamente'
      });
    } catch (error: any) {
      console.error('Error creating board:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear tablero',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un tablero (admin only)
   */
  static async updateBoard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const board = await prisma.tableros.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        data: board,
        message: 'Tablero actualizado exitosamente'
      });
    } catch (error: any) {
      console.error('Error updating board:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar tablero',
        error: error.message
      });
    }
  }

  /**
   * Desactivar un tablero (soft delete)
   */
  static async deleteBoard(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.tableros.update({
        where: { id },
        data: { activo: false }
      });

      res.json({
        success: true,
        message: 'Tablero desactivado exitosamente'
      });
    } catch (error: any) {
      console.error('Error deleting board:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar tablero',
        error: error.message
      });
    }
  }

  /**
   * Generar tablero predeterminado
   */
  static generateDefaultBoard(
    _nombre: string,
    _tema: string,
    totalCasillas: number
  ): { config_casillas: Casilla[], posiciones_estrellas: number[] } {
    const config_casillas: Casilla[] = [];
    const posiciones_estrellas: number[] = [];
    
    // Distribuir tipos de casillas de forma balanceada
    const distribucion = {
      [CasillaType.NORMAL]: Math.floor(totalCasillas * 0.4),
      [CasillaType.PREGUNTA]: Math.floor(totalCasillas * 0.25),
      [CasillaType.ESTRELLA]: 2, // Solo 2 casillas estrella
      [CasillaType.EVENTO]: Math.floor(totalCasillas * 0.15),
      [CasillaType.TRAMPA]: Math.floor(totalCasillas * 0.1),
      [CasillaType.DUELO]: Math.floor(totalCasillas * 0.1)
    };

    // Crear array con todos los tipos según distribución
    const tipos: CasillaType[] = [];
    Object.entries(distribucion).forEach(([tipo, cantidad]) => {
      for (let i = 0; i < cantidad; i++) {
        tipos.push(tipo as CasillaType);
      }
    });

    // Completar con casillas normales si faltan
    while (tipos.length < totalCasillas) {
      tipos.push(CasillaType.NORMAL);
    }

    // Mezclar aleatoriamente (Fisher-Yates shuffle)
    for (let i = tipos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tipos[i], tipos[j]] = [tipos[j], tipos[i]];
    }

    // Primera casilla siempre es START (normal)
    tipos[0] = CasillaType.NORMAL;

    // Crear configuración de casillas
    tipos.forEach((tipo, index) => {
      const casilla: Casilla = {
        posicion: index,
        tipo: tipo,
        nombre: `Casilla ${index}`,
        color: getColorForType(tipo)
      };

      // Registrar posiciones de estrellas
      if (tipo === CasillaType.ESTRELLA) {
        posiciones_estrellas.push(index);
      }

      config_casillas.push(casilla);
    });

    return { config_casillas, posiciones_estrellas };
  }
}

/**
 * Obtener color según tipo de casilla
 */
function getColorForType(tipo: CasillaType): string {
  const colors = {
    [CasillaType.NORMAL]: '#90EE90',   // Verde claro
    [CasillaType.PREGUNTA]: '#87CEEB',  // Azul cielo
    [CasillaType.ESTRELLA]: '#FFD700',  // Dorado
    [CasillaType.DUELO]: '#FF6B6B',     // Rojo claro
    [CasillaType.EVENTO]: '#DDA0DD',    // Morado claro
    [CasillaType.TRAMPA]: '#DC143C'     // Rojo oscuro
  };
  return colors[tipo] || '#FFFFFF';
}

export default BoardsController;
