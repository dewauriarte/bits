import { Router } from 'express';
import { AIController, upload } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { aiGenerateQuizSchema } from '../schemas/quiz.schema';
import { z } from 'zod';

const router = Router();
const aiController = new AIController();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/ai/generate-quiz - Generar quiz desde prompt
router.post(
  '/generate-quiz',
  validateBody(aiGenerateQuizSchema),
  aiController.generateQuiz.bind(aiController)
);

// Schema para validación de PDF form data
const pdfGenerateSchema = z.object({
  num_questions: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(5).max(50)),
  grado_id: z.string().uuid(),
  materia_id: z.string().uuid(),
  dificultad: z.enum(['facil', 'medio', 'dificil']),
  tipo_quiz: z.enum(['kahoot', 'mario_party', 'duelo']).optional(),
  tiempo_por_pregunta: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
});

// POST /api/ai/generate-from-pdf - Generar quiz desde PDF
router.post(
  '/generate-from-pdf',
  upload.single('pdf'),
  validateBody(pdfGenerateSchema),
  aiController.generateFromPDF.bind(aiController)
);

export default router;
