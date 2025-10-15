import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import multer from 'multer';

const aiService = new AIService();

// Configurar multer para subida de archivos PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
});

export class AIController {
  /**
   * POST /api/ai/generate-quiz - Generar quiz desde prompt
   */
  async generateQuiz(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const quizId = await aiService.generateQuiz(userId, data);

      res.json({
        success: true,
        message: 'Quiz generado exitosamente',
        data: {
          quiz_id: quizId,
        },
      });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar quiz',
      });
    }
  }

  /**
   * POST /api/ai/generate-from-pdf - Generar quiz desde PDF
   */
  async generateFromPDF(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      console.log('PDF Upload - Request body:', req.body);
      console.log('PDF Upload - File:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó un archivo PDF',
        });
        return;
      }

      const pdfBuffer = req.file.buffer;
      const params = {
        num_questions: parseInt(req.body.num_questions),
        grado_id: req.body.grado_id,
        materia_id: req.body.materia_id,
        dificultad: req.body.dificultad,
        tipo_quiz: req.body.tipo_quiz || 'kahoot',
        tiempo_por_pregunta: parseInt(req.body.tiempo_por_pregunta) || 20,
      };

      console.log('PDF Upload - Parsed params:', params);

      const quizId = await aiService.generateFromPDF(userId, pdfBuffer, params);

      res.json({
        success: true,
        message: 'Quiz generado desde PDF exitosamente',
        data: {
          quiz_id: quizId,
        },
      });
    } catch (error: any) {
      console.error('Error generating quiz from PDF:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar quiz desde PDF',
      });
    }
  }
}

export { upload };
