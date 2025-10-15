import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username o email es requerido'),
  password: z
    .string()
    .min(1, 'Contraseña es requerida'),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema Base
const baseRegisterSchema = {
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(50, 'Username no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido'),
  
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  
  nombre: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  
  apellido: z
    .string()
    .min(2, 'Apellido debe tener al menos 2 caracteres')
    .max(100, 'Apellido no puede exceder 100 caracteres'),
  
  fechaNacimiento: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate < today;
    }, 'Fecha de nacimiento inválida'),
  
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Debes aceptar los términos y condiciones'),
};

// Register Estudiante Schema
export const registerEstudianteSchema = z
  .object({
    ...baseRegisterSchema,
    rol: z.literal('estudiante'),
    idGrado: z
      .number({ required_error: 'Debes seleccionar un grado' })
      .int()
      .positive('Selecciona un grado válido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterEstudianteFormData = z.infer<typeof registerEstudianteSchema>;

// Register Profesor Schema
export const registerProfesorSchema = z
  .object({
    ...baseRegisterSchema,
    rol: z.literal('profesor'),
    materias: z
      .array(z.number())
      .min(1, 'Debes seleccionar al menos una materia')
      .max(5, 'Puedes seleccionar hasta 5 materias'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterProfesorFormData = z.infer<typeof registerProfesorSchema>;
