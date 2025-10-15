import { z } from 'zod';

// Schema para crear quiz
export const createQuizSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().optional(),
  materia_id: z.string().uuid('Materia ID inválido'),
  grado_id: z.string().uuid('Grado ID inválido'),
  tags: z.array(z.string()).optional().default([]),
  palabras_clave: z.array(z.string()).optional().default([]),
  imagen_portada: z.string().optional(),
  tipo_quiz: z.enum(['kahoot', 'mario_party', 'duelo']).optional().default('kahoot'),
  dificultad: z.enum(['facil', 'medio', 'dificil']).optional(),
  puntos_base: z.number().int().positive().optional().default(1000),
  bonificacion_velocidad: z.boolean().optional().default(true),
  bonificacion_combo: z.boolean().optional().default(true),
  tiempo_por_pregunta: z.number().int().positive().optional().default(20),
  configuracion: z.object({
    musica_fondo: z.boolean().optional().default(true),
    mostrar_ranking: z.boolean().optional().default(true),
    permitir_repetir: z.boolean().optional().default(true),
    mostrar_respuestas: z.boolean().optional().default(true),
    tiempo_congelamiento: z.number().optional().default(5),
  }).optional(),
});

// Schema para actualizar quiz
export const updateQuizSchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  descripcion: z.string().optional(),
  materia_id: z.string().uuid().optional(),
  grado_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  palabras_clave: z.array(z.string()).optional(),
  imagen_portada: z.string().optional(),
  tipo_quiz: z.enum(['kahoot', 'mario_party', 'duelo']).optional(),
  dificultad: z.enum(['facil', 'medio', 'dificil']).optional(),
  puntos_base: z.number().int().positive().optional(),
  bonificacion_velocidad: z.boolean().optional(),
  bonificacion_combo: z.boolean().optional(),
  tiempo_por_pregunta: z.number().int().positive().optional(),
  configuracion: z.object({
    musica_fondo: z.boolean().optional(),
    mostrar_ranking: z.boolean().optional(),
    permitir_repetir: z.boolean().optional(),
    mostrar_respuestas: z.boolean().optional(),
    tiempo_congelamiento: z.number().optional(),
  }).optional(),
});

// Schema para query de listado
export const getQuizzesQuerySchema = z.object({
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  materia_id: z.string().uuid().optional(),
  grado_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Schema para crear pregunta
export const createQuestionSchema = z.object({
  texto: z.string().min(5, 'La pregunta debe tener al menos 5 caracteres'),
  imagen_url: z.string().optional(),
  video_url: z.string().optional(),
  audio_url: z.string().optional(),
  tipo: z.enum([
    'multiple_choice',    // Una respuesta correcta
    'multiple_select',    // Varias respuestas correctas
    'true_false',         // Verdadero/Falso
    'short_answer',       // Respuesta corta
    'fill_blanks',        // Completar espacios
    'order_sequence',     // Ordenar secuencia
    'match_pairs'         // Relacionar columnas/pares
  ]).optional().default('multiple_choice'),
  opciones: z.array(z.object({
    texto: z.string(),
    imagen_url: z.string().optional(),
  })).min(0).max(6, 'Máximo 6 opciones'),
  respuesta_correcta: z.union([
    z.string(), // Para verdadero/falso o texto libre
    z.array(z.string()), // Para opción múltiple (índices como strings: "0", "1", etc.)
  ]),
  puntos: z.number().int().positive().optional().default(1000),
  tiempo_limite: z.number().int().positive().optional().default(20),
  explicacion: z.string().optional(),
  imagen_explicacion: z.string().optional(),
});

// Schema para actualizar pregunta
export const updateQuestionSchema = z.object({
  texto: z.string().min(5).optional(),
  imagen_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  tipo: z.enum([
    'multiple_choice',
    'multiple_select',
    'true_false',
    'short_answer',
    'fill_blanks',
    'order_sequence',
    'match_pairs'
  ]).optional(),
  opciones: z.array(z.object({
    texto: z.string(),
    imagen_url: z.string().optional(),
  })).min(0).max(6).optional(),
  respuesta_correcta: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  puntos: z.number().int().positive().optional(),
  tiempo_limite: z.number().int().positive().optional(),
  explicacion: z.string().optional(),
  imagen_explicacion: z.string().optional(),
});

// Schema para reordenar preguntas
export const reorderQuestionsSchema = z.object({
  question_ids: z.array(z.string().uuid()).min(1, 'Debe haber al menos una pregunta'),
});

// Schema para generar quiz con IA
export const aiGenerateQuizSchema = z.object({
  prompt: z.string().min(10, 'El prompt debe tener al menos 10 caracteres').max(2000),
  num_questions: z.number().int().min(5, 'Mínimo 5 preguntas').max(50, 'Máximo 50 preguntas'),
  grado_id: z.string().uuid('Grado ID inválido'),
  materia_id: z.string().uuid('Materia ID inválido'),
  dificultad: z.enum(['facil', 'medio', 'dificil']),
  tipo_quiz: z.enum(['kahoot', 'mario_party', 'duelo']).optional().default('kahoot'),
  tiempo_por_pregunta: z.number().int().positive().optional().default(20),
  question_types: z.array(z.enum([
    'multiple_choice',
    'multiple_select',
    'true_false',
    'short_answer',
    'fill_blanks',
    'order_sequence',
    'match_pairs'
  ])).optional(), // Si está vacío o no se envía, la IA usa todos los tipos
});

// Types
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type GetQuizzesQuery = z.infer<typeof getQuizzesQuerySchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
export type AIGenerateQuizInput = z.infer<typeof aiGenerateQuizSchema>;
