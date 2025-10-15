import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/game-results/:roomCode
 * Obtener resultados completos de un juego terminado
 */
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Buscar sala
    const sala = await prisma.salas.findUnique({
      where: { codigo: roomCode },
      include: {
        quizzes: {
          select: {
            titulo: true,
            preguntas: {
              select: {
                id: true,
                texto: true,
                tipo: true,
              },
            },
          },
        },
      },
    });

    if (!sala) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Obtener resultados finales (leaderboard)
    const resultadosFinales = await prisma.resultados_finales.findMany({
      where: { sala_id: sala.id },
      include: {
        sala_participantes: {
          select: {
            nickname: true,
            avatar: true,
            usuario_id: true,
          },
        },
      },
      orderBy: { posicion: 'asc' },
    });

    // Formatear leaderboard
    const leaderboard = resultadosFinales.map((resultado) => ({
      playerId: resultado.participante_id,
      nickname: resultado.sala_participantes?.nickname || 'Anónimo',
      avatar: resultado.sala_participantes?.avatar || '👤',
      score: Number(resultado.puntos_totales || 0),
      rank: resultado.posicion || 0,
      correctAnswers: resultado.respuestas_correctas || 0,
      totalAnswered: resultado.preguntas_respondidas || 0,
      accuracy: Number(resultado.porcentaje_acierto || 0),
      avgResponseTime: Number(resultado.tiempo_promedio_respuesta || 0),
    }));

    // Análisis por pregunta
    const preguntas = sala.quizzes?.preguntas || [];
    const questionsAnalysis = await Promise.all(
      preguntas.map(async (pregunta) => {
        // Contar respuestas por pregunta
        const respuestas = await prisma.sala_respuestas.findMany({
          where: {
            sala_id: sala.id,
            pregunta_id: pregunta.id,
          },
        });

        const totalAnswers = respuestas.length;
        const correctAnswers = respuestas.filter((r) => r.correcta).length;
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        const avgResponseTime = totalAnswers > 0
          ? respuestas.reduce((sum, r) => sum + (r.tiempo_respuesta_ms || 0), 0) / totalAnswers / 1000
          : 0;

        // Determinar dificultad
        let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
        if (accuracy >= 75) difficulty = 'easy';
        else if (accuracy < 50) difficulty = 'hard';

        return {
          questionId: pregunta.id,
          questionText: pregunta.texto,
          correctAnswers,
          totalAnswers,
          accuracy: Math.round(accuracy * 10) / 10,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          difficulty,
        };
      })
    );

    // Stats de la clase
    const totalPlayers = leaderboard.length;
    const avgAccuracy = totalPlayers > 0
      ? leaderboard.reduce((sum, p) => sum + (p.accuracy || 0), 0) / totalPlayers
      : 0;
    const avgScore = totalPlayers > 0
      ? leaderboard.reduce((sum, p) => sum + (p.score || 0), 0) / totalPlayers
      : 0;
    const avgResponseTime = totalPlayers > 0
      ? leaderboard.reduce((sum, p) => sum + (p.avgResponseTime || 0), 0) / totalPlayers
      : 0;

    // Identificar temas débiles y fuertes
    const weakQuestions = questionsAnalysis.filter((q) => q.accuracy < 60);
    const strongQuestions = questionsAnalysis.filter((q) => q.accuracy >= 80);

    const classStats = {
      totalPlayers,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgScore: Math.round(avgScore),
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      completionRate: totalPlayers > 0 ? 100 : 0,
      weakTopics: weakQuestions.map((q) => q.questionText).slice(0, 5),
      strongTopics: strongQuestions.map((q) => q.questionText).slice(0, 5),
    };

    res.json({
      success: true,
      data: {
        sala: {
          codigo: sala.codigo,
          titulo: sala.quizzes?.titulo || 'Quiz',
          estado: sala.estado,
          fecha_fin: sala.fecha_fin,
        },
        leaderboard,
        questionsAnalysis,
        classStats,
      },
    });
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados del juego' });
  }
});

export default router;
