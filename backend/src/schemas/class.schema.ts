import { z } from 'zod';

// GET /api/classes - Query params
export const getClassesQuerySchema = z.object({
  grado_id: z.string().uuid().optional(),
  materia_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type GetClassesQuery = z.infer<typeof getClassesQuerySchema>;

// POST /api/classes - Crear clase
export const createClassSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  descripcion: z.string().max(500).optional(),
  grado_id: z.string().uuid('ID de grado inválido'),
  materia_id: z.string().uuid('ID de materia inválida'),
  anio_escolar: z.string().regex(/^\d{4}$/, 'Año escolar inválido (formato: YYYY)'),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

// PUT /api/classes/:id - Actualizar clase
export const updateClassSchema = z.object({
  nombre: z.string().min(3).max(100).optional(),
  descripcion: z.string().max(500).optional(),
  grado_id: z.string().uuid().optional(),
  materia_id: z.string().uuid().optional(),
  anio_escolar: z.string().regex(/^\d{4}$/, 'Año escolar inválido (formato: YYYY)').optional(),
  activo: z.boolean().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;

// POST /api/classes/join - Unirse a clase
export const joinClassSchema = z.object({
  codigo: z.string()
    .length(6, 'El código debe tener 6 caracteres')
    .regex(/^[A-Z0-9]{6}$/, 'Código inválido'),
});

export type JoinClassInput = z.infer<typeof joinClassSchema>;
