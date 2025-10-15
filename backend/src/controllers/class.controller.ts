import { Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { ImportStudentsService } from '../services/importStudents.service';

const classService = new ClassService();
const importStudentsService = new ImportStudentsService();

export class ClassController {
  // GET /api/classes
  async getClasses(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;
      const query = req.query;

      const result = await classService.getClasses(userId, query as any, userRole);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener clases',
      });
    }
  }

  // POST /api/classes
  async createClass(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const clase = await classService.createClass(userId, data);

      res.status(201).json({
        success: true,
        message: 'Clase creada exitosamente',
        data: clase,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear clase',
      });
    }
  }

  // GET /api/classes/:id
  async getClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;

      const clase = await classService.getClassById(id, userId, userRole);

      res.json({
        success: true,
        data: clase,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener clase',
      });
    }
  }

  // PUT /api/classes/:id
  async updateClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;
      const data = req.body;

      const clase = await classService.updateClass(id, userId, data, userRole);

      res.json({
        success: true,
        message: 'Clase actualizada exitosamente',
        data: clase,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar clase',
      });
    }
  }

  // DELETE /api/classes/:id
  async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;

      const result = await classService.deleteClass(id, userId, userRole);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al archivar clase',
      });
    }
  }

  // POST /api/classes/join
  async joinClass(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const clase = await classService.joinClass(userId, data);

      res.json({
        success: true,
        message: 'Te has unido a la clase exitosamente',
        data: clase,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al unirse a la clase',
      });
    }
  }

  // GET /api/classes/:id/students
  async getClassStudents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;

      const estudiantes = await classService.getClassStudents(id, userId, userRole);

      res.json({
        success: true,
        data: estudiantes,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener estudiantes',
      });
    }
  }

  // DELETE /api/classes/:id/students/:studentId
  async removeStudent(req: Request, res: Response) {
    try {
      const { id, studentId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;

      const result = await classService.removeStudent(id, studentId, userId, userRole);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al remover estudiante',
      });
    }
  }

  // GET /api/students/classes
  async getStudentClasses(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const clases = await classService.getStudentClasses(userId);

      res.json({
        success: true,
        data: clases,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener clases',
      });
    }
  }

  // GET /api/classes/:id/stats
  async getClassStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.rol;

      const stats = await classService.getClassStats(id, userId, userRole);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  // POST /api/classes/:id/import-students
  async importStudents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { students } = req.body;

      if (!students || !Array.isArray(students)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de estudiantes',
        });
      }

      const result = await importStudentsService.importStudents(id, userId, students);

      res.json({
        success: true,
        message: `Importación completada: ${result.nuevos} nuevos, ${result.existentes} existentes`,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al importar estudiantes',
      });
    }
  }

  // GET /api/classes/template/download
  async downloadTemplate(req: Request, res: Response) {
    try {
      const template = importStudentsService.generateTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_estudiantes.csv');
      res.send(template);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al generar plantilla',
      });
    }
  }

  // GET /api/students/search/:username - Buscar estudiante por username
  async searchStudent(req: Request, res: Response) {
    try {
      const { username } = req.params;
      
      const student = await classService.searchStudentByUsername(username);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar estudiante',
      });
    }
  }

  // GET /api/students/search - Buscar estudiantes (autocompletado)
  async searchStudents(req: Request, res: Response) {
    try {
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'El parámetro de búsqueda es requerido',
        });
      }

      const students = await classService.searchStudents(q, limit ? parseInt(limit as string) : 10);

      res.json({
        success: true,
        data: students,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar estudiantes',
      });
    }
  }

  // POST /api/classes/:id/add-student - Agregar estudiante existente a clase
  async addExistingStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { estudianteId } = req.body;

      if (!estudianteId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID del estudiante',
        });
      }

      await classService.addExistingStudent(id, estudianteId, userId);

      res.json({
        success: true,
        message: 'Estudiante agregado exitosamente',
      });
    } catch (error: any) {
      const status = error.message.includes('ya está inscrito') ? 400 : 
                     error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al agregar estudiante',
      });
    }
  }

  // POST /api/classes/:id/create-student - Crear nuevo estudiante y agregar a clase
  async createStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { username, nombre, apellido } = req.body;

      if (!username || !nombre || !apellido) {
        return res.status(400).json({
          success: false,
          message: 'Username, nombre y apellido son obligatorios',
        });
      }

      const result = await importStudentsService.createAndAddStudent(id, userId, {
        username,
        nombre,
        apellido,
      });

      res.json({
        success: true,
        message: 'Estudiante creado y agregado exitosamente',
        data: {
          usuario: result.usuario,
          password: result.password,
        },
      });
    } catch (error: any) {
      const status = error.message.includes('ya está registrado') ? 400 :
                     error.message.includes('No tienes permiso') ? 403 : 404;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al crear estudiante',
      });
    }
  }
}
