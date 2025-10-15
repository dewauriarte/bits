import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

// GET /api/catalog/grados
router.get('/grados', async (_req: Request, res: Response) => {
  try {
    const grados = await prisma.grados.findMany({
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        nombre: true,
        nivel: true,
        orden: true,
      },
    });

    res.json({
      success: true,
      data: grados,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener grados',
    });
  }
});

// GET /api/catalog/materias
router.get('/materias', async (_req: Request, res: Response) => {
  try {
    const materias = await prisma.materias.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        icono: true,
      },
    });

    res.json({
      success: true,
      data: materias,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener materias',
    });
  }
});

export default router;
