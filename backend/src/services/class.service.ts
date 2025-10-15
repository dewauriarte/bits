import prisma from '../config/database';
import {
  CreateClassInput,
  UpdateClassInput,
  JoinClassInput,
  GetClassesQuery,
} from '../schemas/class.schema';

export class ClassService {
  // Generar código único de 6 caracteres
  private generateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O, I, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Verificar que el código sea único
  private async ensureUniqueCode(): Promise<string> {
    let code = this.generateClassCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await prisma.clases.findUnique({
        where: { codigo: code },
      });

      if (!existing) {
        return code;
      }

      code = this.generateClassCode();
      attempts++;
    }

    throw new Error('No se pudo generar un código único');
  }

  // GET /api/classes - Listar clases del profesor
  async getClasses(profesorId: string, query: GetClassesQuery, userRole?: string) {
    const { grado_id, materia_id, search, limit = 20, offset = 0 } = query;

    const where: any = {};
    
    // Solo filtrar por profesor si no es admin
    if (userRole !== 'admin') {
      where.profesor_id = profesorId;
    }

    if (grado_id) {
      where.grado_id = grado_id;
    }

    if (materia_id) {
      where.materia_id = materia_id;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clases, total] = await Promise.all([
      prisma.clases.findMany({
        where,
        include: {
          grados: {
            select: { id: true, nombre: true },
          },
          materias: {
            select: { id: true, nombre: true },
          },
          _count: {
            select: {
              clase_estudiantes: true,
            },
          },
        },
        orderBy: { fecha_creacion: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.clases.count({ where }),
    ]);

    return {
      clases: clases.map((clase) => ({
        ...clase,
        estudiantes_count: clase._count.clase_estudiantes,
        _count: undefined,
      })),
      total,
      limit,
      offset,
    };
  }

  // POST /api/classes - Crear clase
  async createClass(profesorId: string, data: CreateClassInput) {
    // Generar código único
    const codigo = await this.ensureUniqueCode();

    const clase = await prisma.clases.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        codigo,
        grado_id: data.grado_id,
        materia_id: data.materia_id,
        profesor_id: profesorId,
        anio_escolar: data.anio_escolar,
        activo: true,
      },
      include: {
        grados: true,
        materias: true,
      },
    });

    return clase;
  }

  // GET /api/classes/:id - Detalle de clase
  async getClassById(claseId: string, userId: string, userRole: string) {
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
      include: {
        grados: true,
        materias: true,
        usuarios: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        clase_estudiantes: {
          include: {
            usuarios: {
              select: {
                id: true,
                username: true,
                nombre: true,
                apellido: true,
                avatar_url: true,
              },
            },
          },
          orderBy: {
            fecha_inscripcion: 'asc',
          },
        },
      },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Verificar permisos: profesor owner, estudiante inscrito, o admin
    const isProfesor = clase.profesor_id === userId;
    const isEstudiante = clase.clase_estudiantes.some(
      (ec: any) => ec.estudiante_id === userId
    );

    if (!isProfesor && !isEstudiante && userRole !== 'admin') {
      throw new Error('No tienes permiso para ver esta clase');
    }

    return clase;
  }

  // PUT /api/classes/:id - Actualizar clase
  async updateClass(claseId: string, profesorId: string, data: UpdateClassInput, userRole?: string) {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Solo verificar ownership si no es admin
    if (userRole !== 'admin' && clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para editar esta clase');
    }

    const updatedClase = await prisma.clases.update({
      where: { id: claseId },
      data,
      include: {
        grados: true,
        materias: true,
      },
    });

    return updatedClase;
  }

  // DELETE /api/classes/:id - Archivar clase (soft delete)
  async deleteClass(claseId: string, profesorId: string, userRole?: string) {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Solo verificar ownership si no es admin
    if (userRole !== 'admin' && clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para eliminar esta clase');
    }

    // Soft delete: marcar como inactivo
    await prisma.clases.update({
      where: { id: claseId },
      data: { activo: false },
    });

    return { message: 'Clase archivada exitosamente' };
  }

  // POST /api/classes/join - Estudiante se une a clase
  async joinClass(estudianteId: string, data: JoinClassInput) {
    // Buscar clase por código
    const clase = await prisma.clases.findUnique({
      where: { codigo: data.codigo },
      include: {
        _count: {
          select: {
            clase_estudiantes: true,
          },
        },
      },
    });

    if (!clase) {
      throw new Error('Código de clase inválido');
    }

    if (!clase.activo) {
      throw new Error('Esta clase no está activa');
    }

    // capacidad_maxima no existe en DB, se maneja con lógica
    const capacidadMaxima = 40;
    if (clase._count.clase_estudiantes >= capacidadMaxima) {
      throw new Error('La clase ha alcanzado su capacidad máxima');
    }

    // Verificar si ya está inscrito
    const yaInscrito = await prisma.clase_estudiantes.findFirst({
      where: {
        estudiante_id: estudianteId,
        clase_id: clase.id,
      },
    });

    if (yaInscrito) {
      throw new Error('Ya estás inscrito en esta clase');
    }

    // Inscribir estudiante
    await prisma.clase_estudiantes.create({
      data: {
        estudiante_id: estudianteId,
        clase_id: clase.id,
        estado: 'activo',
      },
    });

    // Retornar clase con info completa
    const claseCompleta = await prisma.clases.findUnique({
      where: { id: clase.id },
      include: {
        grados: true,
        materias: true,
        usuarios: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return claseCompleta;
  }

  // GET /api/classes/:id/students - Listar estudiantes de la clase
  async getClassStudents(claseId: string, profesorId: string, userRole?: string) {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Solo verificar ownership si no es admin
    if (userRole !== 'admin' && clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para ver los estudiantes de esta clase');
    }

    // Obtener estudiantes con sus perfiles
    const estudiantes = await prisma.clase_estudiantes.findMany({
      where: {
        clase_id: claseId,
        estado: 'activo',
      },
      include: {
        usuarios: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true,
            avatar_url: true,
            fecha_nacimiento: true,
            perfiles_gamer: {
              select: {
                nivel: true,
                experiencia: true,
                puntos_totales: true,
                copas: true,
                trofeos_oro: true,
                trofeos_plata: true,
                trofeos_bronce: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_inscripcion: 'asc',
      },
    });

    return estudiantes.map((e) => ({
      id: e.id,
      fecha_inscripcion: e.fecha_inscripcion,
      estudiante: e.usuarios
        ? {
            ...e.usuarios,
            perfiles_gamer: e.usuarios.perfiles_gamer
              ? {
                  ...e.usuarios.perfiles_gamer,
                  puntos_totales: Number(e.usuarios.perfiles_gamer.puntos_totales || 0),
                }
              : null,
          }
        : null,
    }));
  }

  // DELETE /api/classes/:id/students/:studentId - Remover estudiante
  async removeStudent(claseId: string, studentId: string, profesorId: string, userRole?: string) {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Solo verificar ownership si no es admin
    if (userRole !== 'admin' && clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para gestionar esta clase');
    }

    // Buscar inscripción
    const inscripcion = await prisma.clase_estudiantes.findFirst({
      where: {
        clase_id: claseId,
        estudiante_id: studentId,
      },
    });

    if (!inscripcion) {
      throw new Error('El estudiante no está inscrito en esta clase');
    }

    // Remover (o marcar como inactivo)
    await prisma.clase_estudiantes.delete({
      where: {
        id: inscripcion.id,
      },
    });

    return { message: 'Estudiante removido exitosamente' };
  }

  // GET /api/students/classes - Listar clases del estudiante
  async getStudentClasses(estudianteId: string) {
    const inscripciones = await prisma.clase_estudiantes.findMany({
      where: {
        estudiante_id: estudianteId,
        estado: 'activo',
      },
      include: {
        clases: {
          include: {
            grados: true,
            materias: true,
            usuarios: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_inscripcion: 'desc',
      },
    });

    return inscripciones.map((inscripcion) => ({
      id: inscripcion.id,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      clase: inscripcion.clases,
    }));
  }

  // ClassService.getClassStats(classId) - Estadísticas de la clase
  async getClassStats(claseId: string, userId: string, userRole: string) {
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
      include: {
        _count: {
          select: {
            clase_estudiantes: true,
            salas: true,
          },
        },
      },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    // Solo el profesor owner puede ver las estadísticas
    if (clase.profesor_id !== userId && userRole !== 'admin') {
      throw new Error('No tienes permiso para ver las estadísticas de esta clase');
    }

    // Obtener estadísticas de salas (quizzes jugados)
    const salasFinalizadas = await prisma.salas.count({
      where: {
        clase_id: claseId,
        estado: 'finalizada',
      },
    });

    const salasActivas = await prisma.salas.count({
      where: {
        clase_id: claseId,
        estado: { in: ['esperando', 'en_progreso'] },
      },
    });

    return {
      total_estudiantes: clase._count.clase_estudiantes,
      salas_creadas: clase._count.salas,
      salas_finalizadas: salasFinalizadas,
      salas_activas: salasActivas,
      clase_activa: clase.activo,
      fecha_creacion: clase.fecha_creacion,
    };
  }

  // Buscar estudiante por username, nombre o apellido
  async searchStudentByUsername(searchTerm: string) {
    const cleanTerm = searchTerm.trim();

    // Buscar por username exacto primero
    let usuario = await prisma.usuarios.findFirst({
      where: {
        username: cleanTerm.toLowerCase(),
        rol: 'estudiante',
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        avatar_url: true,
      },
    });

    // Si no se encuentra, buscar por nombre o apellido
    if (!usuario) {
      usuario = await prisma.usuarios.findFirst({
        where: {
          rol: 'estudiante',
          OR: [
            { nombre: { contains: cleanTerm, mode: 'insensitive' } },
            { apellido: { contains: cleanTerm, mode: 'insensitive' } },
            { username: { contains: cleanTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          avatar_url: true,
        },
      });
    }

    return usuario;
  }

  // Buscar múltiples estudiantes para autocompletado
  async searchStudents(searchTerm: string, limit: number = 10) {
    const cleanTerm = searchTerm.trim();
    
    if (cleanTerm.length < 2) {
      return [];
    }

    const usuarios = await prisma.usuarios.findMany({
      where: {
        rol: 'estudiante',
        OR: [
          { username: { contains: cleanTerm, mode: 'insensitive' } },
          { nombre: { contains: cleanTerm, mode: 'insensitive' } },
          { apellido: { contains: cleanTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        apellido: true,
        avatar_url: true,
      },
      take: limit,
      orderBy: {
        nombre: 'asc',
      },
    });

    return usuarios;
  }

  // Agregar estudiante existente a clase
  async addExistingStudent(claseId: string, estudianteId: string, profesorId: string) {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    if (clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para agregar estudiantes a esta clase');
    }

    // Verificar que el usuario existe y es estudiante
    const estudiante = await prisma.usuarios.findUnique({
      where: { id: estudianteId },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    if (estudiante.rol !== 'estudiante') {
      throw new Error('El usuario no es un estudiante');
    }

    // Verificar si ya está inscrito
    const yaInscrito = await prisma.clase_estudiantes.findFirst({
      where: {
        clase_id: claseId,
        estudiante_id: estudianteId,
      },
    });

    if (yaInscrito) {
      throw new Error('El estudiante ya está inscrito en esta clase');
    }

    // Inscribir estudiante
    await prisma.clase_estudiantes.create({
      data: {
        clase_id: claseId,
        estudiante_id: estudianteId,
        estado: 'activo',
      },
    });

    return { message: 'Estudiante agregado exitosamente' };
  }
}
