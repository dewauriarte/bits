import { z } from 'zod';

// Método 1: Join por Código PIN
export const joinByCodeSchema = z.object({
  game_code: z
    .string()
    .length(6, 'Código debe tener 6 caracteres')
    .toUpperCase(),
  student_name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100),
});

// Método 2: Join por QR Code
export const joinByQRSchema = z.object({
  qr_token: z.string().min(1, 'QR token es requerido'),
});

// Método 3: Join por Link Directo
export const joinByLinkSchema = z.object({
  game_code: z.string().length(6).toUpperCase(),
  student_name: z.string().min(2).max(100),
  student_id: z.string().uuid().optional(), // Si ya está registrado
});

// Método 4: Registro Permanente (Sin Email)
export const registerPermanentSchema = z.object({
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[a-z]+\.[a-z]+$/, 'Username debe ser formato: nombre.apellido'),
  password: z
    .string()
    .min(4, 'Password debe tener al menos 4 caracteres'), // Simple para niños
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  age: z.number().int().min(3).max(18),
  grade_id: z.union([z.string().uuid(), z.number().int().min(1).max(14)]),
  email: z.string().email().optional().nullable(), // Opcional, NO requerido
});

// Método 4: Login Permanente
export const loginPermanentSchema = z.object({
  username: z.string().min(1, 'Username es requerido'),
  password: z.string().min(1, 'Password es requerido'),
});

// Método 5: Login por Avatar (Niños 3-6 años)
export const loginByAvatarSchema = z.object({
  avatar_id: z.string().uuid(),
  class_id: z.string().uuid(),
});

// Asignar avatar a estudiante (Profesor)
export const assignAvatarSchema = z.object({
  estudiante_id: z.string().uuid(),
});

export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;
export type JoinByQRInput = z.infer<typeof joinByQRSchema>;
export type JoinByLinkInput = z.infer<typeof joinByLinkSchema>;
export type RegisterPermanentInput = z.infer<typeof registerPermanentSchema>;
export type LoginPermanentInput = z.infer<typeof loginPermanentSchema>;
export type LoginByAvatarInput = z.infer<typeof loginByAvatarSchema>;
export type AssignAvatarInput = z.infer<typeof assignAvatarSchema>;
