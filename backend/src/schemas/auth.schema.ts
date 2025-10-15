import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username solo puede contener letras, números y guiones bajos'),
  email: z.string().email('Email inválido').optional(),
  password: z
    .string()
    .min(6, 'Password debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Password debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Password debe tener al menos un número'),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().min(2, 'Apellido debe tener al menos 2 caracteres').max(100),
  rol: z.enum(['admin', 'profesor', 'estudiante']),
  fechaNacimiento: z.string().optional(),
  tipoAuth: z.enum(['email', 'username', 'avatar', 'temporal']).optional().default('username'),
}).refine((data) => {
  // Email es requerido para admin y profesor
  if (data.rol === 'admin' || data.rol === 'profesor') {
    return !!data.email;
  }
  return true;
}, {
  message: 'Email es requerido para administradores y profesores',
  path: ['email'],
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username es requerido'),
  password: z.string().min(1, 'Password es requerido'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es requerido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
