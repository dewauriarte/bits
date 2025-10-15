import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createQuizSchema,
  updateQuizSchema,
  getQuizzesQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
} from '../schemas/quiz.schema';

const router = Router();
const quizController = new QuizController();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD Quizzes
router.get(
  '/',
  validateQuery(getQuizzesQuerySchema),
  quizController.getQuizzes.bind(quizController)
);

router.post(
  '/',
  validateBody(createQuizSchema),
  quizController.createQuiz.bind(quizController)
);

router.get('/:id', quizController.getQuizById.bind(quizController));

router.put(
  '/:id',
  validateBody(updateQuizSchema),
  quizController.updateQuiz.bind(quizController)
);

router.delete('/:id', quizController.deleteQuiz.bind(quizController));

// Publicar quiz
router.post('/:id/publish', quizController.publishQuiz.bind(quizController));

// CRUD Preguntas
router.post(
  '/:id/questions',
  validateBody(createQuestionSchema),
  quizController.createQuestion.bind(quizController)
);

router.put(
  '/:quizId/questions/:questionId',
  validateBody(updateQuestionSchema),
  quizController.updateQuestion.bind(quizController)
);

router.delete(
  '/:quizId/questions/:questionId',
  quizController.deleteQuestion.bind(quizController)
);

// Reordenar preguntas
router.put(
  '/:id/questions/reorder',
  validateBody(reorderQuestionsSchema),
  quizController.reorderQuestions.bind(quizController)
);

export default router;
