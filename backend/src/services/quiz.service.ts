import prisma from '../config/database';
import {
  CreateQuizInput,
  UpdateQuizInput,
  GetQuizzesQuery,
  CreateQuestionInput,
  UpdateQuestionInput,
  ReorderQuestionsInput,
} from '../schemas/quiz.schema';

export class QuizService {
  // GET /api/quizzes - Listar quizzes del profesor
  async getQuizzes(creadorId: string, query: GetQuizzesQuery) {
    const { estado, materia_id, grado_id, search, limit = 20, offset = 0 } = query;

    const where: any = {
      creador_id: creadorId,
    };

    if (estado) {
      where.estado = estado;
    }

    if (materia_id) {
      where.materia_id = materia_id;
    }

    if (grado_id) {
      where.grado_id = grado_id;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [quizzes, total] = await Promise.all([
      prisma.quizzes.findMany({
        where,
        include: {
          grados: true,
          materias: true,
          _count: {
            select: {
              preguntas: true,
            },
          },
        },
        orderBy: { fecha_actualizacion: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.quizzes.count({ where }),
    ]);

    return {
      quizzes: quizzes.map((quiz) => ({
        ...quiz,
        num_preguntas: quiz._count.preguntas,
        _count: undefined,
      })),
      total,
      limit,
      offset,
    };
  }

  // POST /api/quizzes - Crear quiz
  async createQuiz(creadorId: string, data: CreateQuizInput) {
    const quiz = await prisma.quizzes.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        creador_id: creadorId,
        materia_id: data.materia_id,
        grado_id: data.grado_id,
        tags: data.tags || [],
        palabras_clave: data.palabras_clave || [],
        imagen_portada: data.imagen_portada,
        tipo_quiz: data.tipo_quiz,
        dificultad: data.dificultad,
        puntos_base: data.puntos_base,
        bonificacion_velocidad: data.bonificacion_velocidad,
        bonificacion_combo: data.bonificacion_combo,
        tiempo_por_pregunta: data.tiempo_por_pregunta,
        configuracion: data.configuracion as any,
        estado: 'borrador',
      },
      include: {
        grados: true,
        materias: true,
      },
    });

    return quiz;
  }

  // GET /api/quizzes/:id - Detalle completo
  async getQuizById(quizId: string, userId: string) {
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
      include: {
        grados: true,
        materias: true,
        usuarios: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        preguntas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    // Verificar permisos: solo el creador puede ver
    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para ver este quiz');
    }

    return quiz;
  }

  // PUT /api/quizzes/:id - Actualizar quiz
  async updateQuiz(quizId: string, userId: string, data: UpdateQuizInput) {
    // Verificar que el quiz existe y pertenece al usuario
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para editar este quiz');
    }

    // Solo se puede editar si está en borrador
    if (quiz.estado !== 'borrador') {
      throw new Error('Solo se pueden editar quizzes en estado borrador');
    }

    const updatedQuiz = await prisma.quizzes.update({
      where: { id: quizId },
      data: {
        ...data,
        fecha_actualizacion: new Date(),
      },
      include: {
        grados: true,
        materias: true,
      },
    });

    return updatedQuiz;
  }

  // DELETE /api/quizzes/:id - Archivar quiz
  async deleteQuiz(quizId: string, userId: string) {
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para eliminar este quiz');
    }

    // Soft delete: cambiar estado a archivado
    await prisma.quizzes.update({
      where: { id: quizId },
      data: { estado: 'archivado' },
    });

    return { message: 'Quiz archivado exitosamente' };
  }

  // POST /api/quizzes/:id/publish - Publicar quiz
  async publishQuiz(quizId: string, userId: string) {
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            preguntas: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para publicar este quiz');
    }

    // Validar que tenga mínimo 5 preguntas
    if (quiz._count.preguntas < 5) {
      throw new Error('El quiz debe tener al menos 5 preguntas para ser publicado');
    }

    const updatedQuiz = await prisma.quizzes.update({
      where: { id: quizId },
      data: {
        estado: 'publicado',
        fecha_actualizacion: new Date(),
      },
      include: {
        grados: true,
        materias: true,
      },
    });

    return updatedQuiz;
  }

  // POST /api/quizzes/:id/questions - Crear pregunta
  async createQuestion(quizId: string, userId: string, data: CreateQuestionInput) {
    // Verificar que el quiz existe y pertenece al usuario
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            preguntas: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para agregar preguntas a este quiz');
    }

    // Obtener el próximo orden
    const nextOrden = quiz._count.preguntas + 1;

    const pregunta = await prisma.preguntas.create({
      data: {
        quiz_id: quizId,
        orden: nextOrden,
        texto: data.texto,
        imagen_url: data.imagen_url,
        video_url: data.video_url,
        audio_url: data.audio_url,
        tipo: data.tipo,
        opciones: data.opciones as any,
        respuesta_correcta: data.respuesta_correcta as any,
        puntos: data.puntos,
        tiempo_limite: data.tiempo_limite,
        explicacion: data.explicacion,
        imagen_explicacion: data.imagen_explicacion,
      },
    });

    return pregunta;
  }

  // PUT /api/quizzes/:quizId/questions/:questionId - Actualizar pregunta
  async updateQuestion(
    quizId: string,
    questionId: string,
    userId: string,
    data: UpdateQuestionInput
  ) {
    // Verificar que el quiz existe y pertenece al usuario
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para editar preguntas de este quiz');
    }

    // Verificar que la pregunta existe y pertenece al quiz
    const pregunta = await prisma.preguntas.findFirst({
      where: {
        id: questionId,
        quiz_id: quizId,
      },
    });

    if (!pregunta) {
      throw new Error('Pregunta no encontrada');
    }

    const updatedPregunta = await prisma.preguntas.update({
      where: { id: questionId },
      data,
    });

    return updatedPregunta;
  }

  // DELETE /api/quizzes/:quizId/questions/:questionId - Eliminar pregunta
  async deleteQuestion(quizId: string, questionId: string, userId: string) {
    // Verificar que el quiz existe y pertenece al usuario
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para eliminar preguntas de este quiz');
    }

    // Verificar que la pregunta existe y pertenece al quiz
    const pregunta = await prisma.preguntas.findFirst({
      where: {
        id: questionId,
        quiz_id: quizId,
      },
    });

    if (!pregunta) {
      throw new Error('Pregunta no encontrada');
    }

    // Eliminar la pregunta
    await prisma.preguntas.delete({
      where: { id: questionId },
    });

    // Reordenar las preguntas restantes
    const preguntasRestantes = await prisma.preguntas.findMany({
      where: { quiz_id: quizId },
      orderBy: { orden: 'asc' },
    });

    // Actualizar el orden
    for (let i = 0; i < preguntasRestantes.length; i++) {
      await prisma.preguntas.update({
        where: { id: preguntasRestantes[i].id },
        data: { orden: i + 1 },
      });
    }

    return { message: 'Pregunta eliminada exitosamente' };
  }

  // PUT /api/quizzes/:id/questions/reorder - Reordenar preguntas
  async reorderQuestions(quizId: string, userId: string, data: ReorderQuestionsInput) {
    // Verificar que el quiz existe y pertenece al usuario
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    if (quiz.creador_id !== userId) {
      throw new Error('No tienes permiso para reordenar preguntas de este quiz');
    }

    // Actualizar el orden de cada pregunta
    for (let i = 0; i < data.question_ids.length; i++) {
      await prisma.preguntas.updateMany({
        where: {
          id: data.question_ids[i],
          quiz_id: quizId,
        },
        data: {
          orden: i + 1,
        },
      });
    }

    return { message: 'Preguntas reordenadas exitosamente' };
  }
}
