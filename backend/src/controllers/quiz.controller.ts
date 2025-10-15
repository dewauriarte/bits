import { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service';

const quizService = new QuizService();

export class QuizController {
  // GET /api/quizzes - Listar quizzes
  async getQuizzes(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const query = req.query;

      const result = await quizService.getQuizzes(userId, query as any);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener quizzes',
      });
    }
  }

  // POST /api/quizzes - Crear quiz
  async createQuiz(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const quiz = await quizService.createQuiz(userId, data);

      res.status(201).json({
        success: true,
        message: 'Quiz creado exitosamente',
        data: quiz,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear quiz',
      });
    }
  }

  // GET /api/quizzes/:id - Detalle de quiz
  async getQuizById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      console.log('GET Quiz - ID:', id, 'User:', userId);

      const quiz = await quizService.getQuizById(id, userId);

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error: any) {
      console.error('Error getting quiz:', error.message);
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener quiz',
      });
    }
  }

  // PUT /api/quizzes/:id - Actualizar quiz
  async updateQuiz(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const data = req.body;

      const quiz = await quizService.updateQuiz(id, userId, data);

      res.json({
        success: true,
        message: 'Quiz actualizado exitosamente',
        data: quiz,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 
                     error.message.includes('borrador') ? 400 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar quiz',
      });
    }
  }

  // DELETE /api/quizzes/:id - Archivar quiz
  async deleteQuiz(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await quizService.deleteQuiz(id, userId);

      res.json({
        success: true,
        message: 'Quiz archivado exitosamente',
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al archivar quiz',
      });
    }
  }

  // POST /api/quizzes/:id/publish - Publicar quiz
  async publishQuiz(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const quiz = await quizService.publishQuiz(id, userId);

      res.json({
        success: true,
        message: 'Quiz publicado exitosamente',
        data: quiz,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 :
                     error.message.includes('al menos 5 preguntas') ? 400 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al publicar quiz',
      });
    }
  }

  // POST /api/quizzes/:id/questions - Crear pregunta
  async createQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const data = req.body;

      const pregunta = await quizService.createQuestion(id, userId, data);

      res.status(201).json({
        success: true,
        message: 'Pregunta creada exitosamente',
        data: pregunta,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al crear pregunta',
      });
    }
  }

  // PUT /api/quizzes/:quizId/questions/:questionId - Actualizar pregunta
  async updateQuestion(req: Request, res: Response) {
    try {
      const { quizId, questionId } = req.params;
      const userId = (req as any).user.id;
      const data = req.body;

      const pregunta = await quizService.updateQuestion(quizId, questionId, userId, data);

      res.json({
        success: true,
        message: 'Pregunta actualizada exitosamente',
        data: pregunta,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar pregunta',
      });
    }
  }

  // DELETE /api/quizzes/:quizId/questions/:questionId - Eliminar pregunta
  async deleteQuestion(req: Request, res: Response) {
    try {
      const { quizId, questionId } = req.params;
      const userId = (req as any).user.id;

      await quizService.deleteQuestion(quizId, questionId, userId);

      res.json({
        success: true,
        message: 'Pregunta eliminada exitosamente',
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al eliminar pregunta',
      });
    }
  }

  // PUT /api/quizzes/:id/questions/reorder - Reordenar preguntas
  async reorderQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const data = req.body;

      await quizService.reorderQuestions(id, userId, data);

      res.json({
        success: true,
        message: 'Preguntas reordenadas exitosamente',
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al reordenar preguntas',
      });
    }
  }
}
