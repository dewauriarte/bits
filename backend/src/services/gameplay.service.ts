import { Server as SocketIOServer } from 'socket.io';
import prisma from '../config/database';
import redis from '../config/redis';
import { calculateScore, calculateGameRewards, calculateAccuracy } from '../utils/scoring';

/**
 * 🎮 Gameplay Service - Maneja toda la lógica del juego en tiempo real
 * 
 * Responsabilidades:
 * - Inicializar y gestionar el flujo del juego
 * - Enviar preguntas a los jugadores
 * - Procesar respuestas y calcular puntuaciones
 * - Mantener leaderboard en tiempo real
 * - Finalizar juego y otorgar recompensas
 */

export interface GameState {
  roomCode: string;
  quizId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: any[];
  questionStartTime: number | null;
  timeLimit: number;
  timerInterval: NodeJS.Timeout | null;
  leaderboard: PlayerScore[];
  answersReceived: Set<string>; // IDs de jugadores que ya respondieron
}

export interface PlayerScore {
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  comboStreak: number;
  correctAnswers: number;
  totalAnswered: number;
  rank?: number;
}

export interface AnswerSubmission {
  playerId: string;
  questionId: string;
  answer: any; // Puede ser string, number, array dependiendo del tipo
  timeTaken: number;
}

export interface QuestionResult {
  isCorrect: boolean;
  correctAnswer: any;
  points: number;
  breakdown: {
    basePoints: number;
    speedBonus: number;
    comboMultiplier: number;
  };
  comboStreak: number;
}

class GameplayService {
  private io: SocketIOServer | null = null;
  private activeGames: Map<string, GameState> = new Map();

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * 🚀 Inicializar el juego - Cargar preguntas y preparar estado
   */
  async initializeGame(roomCode: string, quizId: string, timePerQuestion: number = 20): Promise<void> {
    // Obtener todas las preguntas del quiz
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!quiz || !quiz.preguntas || quiz.preguntas.length === 0) {
      throw new Error('Quiz no tiene preguntas');
    }

    // Obtener participantes de la sala
    const sala = await prisma.salas.findUnique({
      where: { codigo: roomCode },
      include: {
        sala_participantes: {
          where: { estado: { in: ['conectado', 'listo'] } },
        },
      },
    });

    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    // Inicializar leaderboard con todos los jugadores
    const leaderboard: PlayerScore[] = sala.sala_participantes.map(p => ({
      playerId: p.id,
      nickname: p.nickname || 'Anónimo',
      avatar: p.avatar || '👤',
      score: 0,
      comboStreak: 0,
      correctAnswers: 0,
      totalAnswered: 0,
    }));

    // Shuffle preguntas si está configurado (TODO: check config)
    const questions = quiz.preguntas;

    // Crear estado del juego
    const gameState: GameState = {
      roomCode,
      quizId,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      questions,
      questionStartTime: null,
      timeLimit: timePerQuestion,
      timerInterval: null,
      leaderboard,
      answersReceived: new Set(),
    };

    // Guardar en memoria y Redis
    this.activeGames.set(roomCode, gameState);
    await this.saveGameStateToRedis(roomCode, gameState);

    console.log(`✅ Game initialized for room ${roomCode} with ${questions.length} questions`);
  }

  /**
   * 📤 Enviar pregunta actual a todos los jugadores
   */
  async sendQuestion(roomCode: string): Promise<void> {
    const gameState = this.activeGames.get(roomCode);
    
    if (!gameState) {
      throw new Error('Game state not found');
    }

    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
      // No hay más preguntas - terminar juego
      await this.endGame(roomCode);
      return;
    }

    const question = gameState.questions[gameState.currentQuestionIndex];
    
    // Parsear opciones de JSON (si es necesario)
    let opciones: any[] = [];
    if (question.opciones) {
      // Si opciones es JSON string, parsearlo
      const opcionesData = typeof question.opciones === 'string' 
        ? JSON.parse(question.opciones) 
        : question.opciones;
      
      // Preparar opciones sin respuesta correcta
      opciones = Array.isArray(opcionesData) 
        ? opcionesData.map((opt: any, index: number) => ({
            id: opt.id || String(index),
            texto: opt.texto || opt,
            // NO incluir is_correct
          }))
        : [];
    }
    
    // Preparar pregunta para enviar (sin respuesta correcta)
    const questionData = {
      questionNumber: gameState.currentQuestionIndex + 1,
      totalQuestions: gameState.totalQuestions,
      questionId: question.id,
      texto: question.texto,
      tipo: question.tipo,
      media_url: question.imagen_url || question.video_url || null,
      opciones,
      timeLimit: gameState.timeLimit,
      explicacion: question.explicacion || null, // Agregar explicación
    };

    // Resetear respuestas recibidas
    gameState.answersReceived.clear();
    gameState.questionStartTime = Date.now();

    // Broadcast pregunta
    this.io?.to(`game:${roomCode}`).emit('question:new', questionData);

    // Iniciar timer server-side
    await this.startQuestionTimer(roomCode);

    console.log(`📤 Question ${gameState.currentQuestionIndex + 1}/${gameState.totalQuestions} sent to room ${roomCode}`);
  }

  /**
   * ⏱️ Iniciar timer de la pregunta
   */
  private async startQuestionTimer(roomCode: string): Promise<void> {
    const gameState = this.activeGames.get(roomCode);
    
    if (!gameState) return;

    let timeRemaining = gameState.timeLimit;

    // Limpiar timer anterior si existe
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }

    // Crear nuevo timer
    gameState.timerInterval = setInterval(async () => {
      timeRemaining--;

      // Broadcast tick del timer
      this.io?.to(`game:${roomCode}`).emit('timer:tick', {
        timeRemaining,
      });

      if (timeRemaining <= 0) {
        // Timer expiró
        clearInterval(gameState.timerInterval!);
        gameState.timerInterval = null;

        // Broadcast timeout
        this.io?.to(`game:${roomCode}`).emit('question:timeout', {
          message: '¡Tiempo agotado!',
        });

        // Esperar 3 segundos y mostrar resultados
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.showQuestionResults(roomCode);
      }
    }, 1000);
  }

  /**
   * 📝 Procesar respuesta de un jugador
   */
  async processAnswer(submission: AnswerSubmission): Promise<QuestionResult> {
    const { playerId, questionId, answer, timeTaken } = submission;
    
    // Encontrar la sala del jugador
    const roomCode = await this.findRoomByPlayer(playerId);
    if (!roomCode) {
      throw new Error('Room not found for player');
    }

    const gameState = this.activeGames.get(roomCode);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Validar que no haya expirado el timer
    if (!gameState.questionStartTime || timeTaken > gameState.timeLimit) {
      throw new Error('Time limit exceeded');
    }

    // Validar que no haya respondido ya
    if (gameState.answersReceived.has(playerId)) {
      throw new Error('Already answered this question');
    }

    // Marcar como respondido
    gameState.answersReceived.add(playerId);

    // Obtener pregunta actual
    const question = gameState.questions[gameState.currentQuestionIndex];
    
    // Verificar respuesta correcta
    const isCorrect = this.checkAnswer(question, answer);

    // Obtener player score (o crear si no existe - para late joins)
    let playerScore = gameState.leaderboard.find(p => p.playerId === playerId);
    if (!playerScore) {
      // Player joined late - fetch from database and add to leaderboard
      const participant = await prisma.sala_participantes.findUnique({
        where: { id: playerId },
      });
      
      if (!participant) {
        throw new Error('Player not found in leaderboard');
      }
      
      // Add to leaderboard
      playerScore = {
        playerId: participant.id,
        nickname: participant.nickname || 'Anónimo',
        avatar: participant.avatar || '👤',
        score: 0,
        comboStreak: 0,
        correctAnswers: 0,
        totalAnswered: 0,
      };
      gameState.leaderboard.push(playerScore);
      console.log(`⚠️ Late join: Added ${playerScore.nickname} to leaderboard`);
    }

    // Calcular puntos
    const scoreCalc = calculateScore(
      isCorrect,
      timeTaken,
      gameState.timeLimit,
      playerScore.comboStreak
    );

    // Actualizar combo streak
    if (isCorrect) {
      playerScore.comboStreak++;
      playerScore.correctAnswers++;
    } else {
      playerScore.comboStreak = 0;
    }

    // Actualizar score y stats
    playerScore.score += scoreCalc.totalPoints;
    playerScore.totalAnswered++;

    // Guardar respuesta en BD
    await this.saveAnswer({
      playerId,
      questionId,
      answer,
      isCorrect,
      timeTaken,
      points: scoreCalc.totalPoints,
      comboMultiplier: scoreCalc.comboMultiplier,
    });

    // Actualizar leaderboard
    await this.updateLeaderboard(roomCode);

    // Broadcast leaderboard actualizado
    this.io?.to(`game:${roomCode}`).emit('leaderboard:update', {
      leaderboard: this.getTopLeaderboard(gameState, 10),
      answersCount: gameState.answersReceived.size,
      totalPlayers: gameState.leaderboard.length,
    });

    // Preparar resultado
    const result: QuestionResult = {
      isCorrect,
      correctAnswer: this.getCorrectAnswer(question),
      points: scoreCalc.totalPoints,
      breakdown: {
        basePoints: scoreCalc.basePoints,
        speedBonus: scoreCalc.speedBonus,
        comboMultiplier: scoreCalc.comboMultiplier,
      },
      comboStreak: playerScore.comboStreak,
    };

    return result;
  }

  /**
   * 📊 Mostrar resultados de la pregunta
   */
  private async showQuestionResults(roomCode: string): Promise<void> {
    const gameState = this.activeGames.get(roomCode);
    if (!gameState) return;

    const question = gameState.questions[gameState.currentQuestionIndex];
    
    // Calcular estadísticas de la pregunta
    const totalResponses = gameState.answersReceived.size;
    const correctResponses = gameState.leaderboard.filter(p => {
      // Contar cuántos acertaron (incremento en correctAnswers)
      return p.totalAnswered > 0;
    }).length;

    const stats = {
      questionId: question.id,
      questionText: question.texto,
      correctAnswer: this.getCorrectAnswer(question),
      totalResponses,
      correctResponses,
      accuracy: totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0,
      leaderboard: this.getTopLeaderboard(gameState, 10), // Top 10 para mejor visualización
    };

    // Broadcast resultados
    this.io?.to(`game:${roomCode}`).emit('question:results', stats);

    // Esperar 8 segundos (4s feedback + 4s leaderboard)
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Avanzar a siguiente pregunta
    gameState.currentQuestionIndex++;
    await this.saveGameStateToRedis(roomCode, gameState);

    // Enviar siguiente pregunta o terminar
    if (gameState.currentQuestionIndex < gameState.totalQuestions) {
      // Mostrar pantalla de espera
      this.io?.to(`game:${roomCode}`).emit('question:waiting', {
        message: 'Prepárate para la siguiente pregunta...',
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.sendQuestion(roomCode);
    } else {
      // Terminar juego
      await this.endGame(roomCode);
    }
  }

  /**
   * 🏁 Finalizar el juego y otorgar recompensas
   */
  private async endGame(roomCode: string): Promise<void> {
    const gameState = this.activeGames.get(roomCode);
    if (!gameState) return;

    // Calcular ranking final
    const finalLeaderboard = this.getFinalLeaderboard(gameState);

    // Guardar resultados y otorgar recompensas
    for (let i = 0; i < finalLeaderboard.length; i++) {
      const player = finalLeaderboard[i];
      const rank = i + 1;

      // Calcular recompensas
      const rewards = calculateGameRewards(
        rank,
        finalLeaderboard.length,
        player.score
      );

      // Calcular accuracy
      const accuracy = calculateAccuracy(player.correctAnswers, player.totalAnswered);

      // Guardar resultado en BD
      await this.saveGameResult({
        playerId: player.playerId,
        roomCode,
        rank,
        score: player.score,
        accuracy,
        comboMax: player.comboStreak,
        correctAnswers: player.correctAnswers,
        totalAnswered: player.totalAnswered,
        rewards,
      });

      // Otorgar recompensas al jugador
      await this.grantRewards(player.playerId, rewards, rank);
    }

    // Broadcast resultados finales
    this.io?.to(`game:${roomCode}`).emit('game:finished', {
      leaderboard: finalLeaderboard,
      totalQuestions: gameState.totalQuestions,
    });

    // Actualizar estado de la sala en BD
    const sala = await prisma.salas.update({
      where: { codigo: roomCode },
      data: {
        estado: 'finalizado',
        fecha_fin: new Date(),
      },
      select: { quiz_id: true },
    });

    // Incrementar veces_jugado del quiz
    if (sala.quiz_id) {
      await prisma.quizzes.update({
        where: { id: sala.quiz_id },
        data: {
          veces_jugado: { increment: 1 },
        },
      });
    }

    // Limpiar estado del juego
    this.activeGames.delete(roomCode);
    await redis.del(`gamestate:${roomCode}`);

    console.log(`🏁 Game ended in room ${roomCode}`);
  }

  /**
   * 🎯 Verificar si una respuesta es correcta
   */
  private checkAnswer(question: any, answer: any): boolean {
    const tipo = question.tipo;
    
    // Parse respuesta_correcta si es string JSON
    let respuestaCorrecta = question.respuesta_correcta;
    if (typeof respuestaCorrecta === 'string') {
      try {
        respuestaCorrecta = JSON.parse(respuestaCorrecta);
      } catch (e) {
        // Si no es JSON válido, dejar como string
      }
    }

    switch (tipo) {
      case 'multiple_choice':
      case 'true_false':
        // respuesta_correcta es un array con los índices correctos
        const correctIndices = Array.isArray(respuestaCorrecta) ? respuestaCorrecta : [respuestaCorrecta];
        const answerStr = String(answer);
        
        // Normalizar correctIndices a strings para evitar problemas de tipo
        const correctIndicesStr = correctIndices.map(x => String(x));
        
        // Log para debug de verdadero/falso
        if (tipo === 'true_false') {
          console.log('🔍 True/False validation:', {
            respuesta_correcta: respuestaCorrecta,
            correctIndices,
            correctIndicesStr,
            answer,
            answerStr,
            result: correctIndicesStr.includes(answerStr),
          });
        }
        
        return correctIndicesStr.includes(answerStr);

      case 'multiple_select':
        // answer debe ser array con los índices seleccionados
        const correctMultiple = new Set(Array.isArray(respuestaCorrecta) ? respuestaCorrecta.map(String) : [String(respuestaCorrecta)]);
        const userAnswer = new Set(Array.isArray(answer) ? answer.map(String) : [String(answer)]);
        return correctMultiple.size === userAnswer.size && 
               [...correctMultiple].every(idx => userAnswer.has(idx));

      case 'short_answer':
        // Comparación sin mayúsculas - respuesta_correcta puede ser string o array con una respuesta
        const correctText = Array.isArray(respuestaCorrecta) 
          ? String(respuestaCorrecta[0]).toLowerCase().trim()
          : String(respuestaCorrecta).toLowerCase().trim();
        const userText = String(answer).toLowerCase().trim();
        return correctText === userText;

      case 'fill_blanks':
        // answer debe ser array con las respuestas de cada blank
        const correctBlanks = Array.isArray(respuestaCorrecta) ? respuestaCorrecta : [respuestaCorrecta];
        if (!Array.isArray(answer) || answer.length !== correctBlanks.length) {
          return false;
        }
        return answer.every((ans: string, i: number) => 
          String(ans).toLowerCase().trim() === String(correctBlanks[i]).toLowerCase().trim()
        );

      case 'order_sequence':
        // answer debe ser array con el orden correcto de índices
        const correctOrder = Array.isArray(respuestaCorrecta) ? respuestaCorrecta : [respuestaCorrecta];
        if (!Array.isArray(answer) || answer.length !== correctOrder.length) {
          return false;
        }
        return answer.every((idx: any, i: number) => String(idx) === String(correctOrder[i]));

      case 'match_pairs':
        // answer debe ser objeto { "0": "2", "1": "0", ... } (izquierda: derecha)
        let correctPairs = respuestaCorrecta;
        
        // Retrocompatibilidad: Si es array, convertir a objeto { "0": "0", "1": "1", ... }
        if (Array.isArray(correctPairs)) {
          const pairsObj: Record<string, string> = {};
          correctPairs.forEach((val, idx) => {
            pairsObj[String(idx)] = String(idx);
          });
          correctPairs = pairsObj;
        }
        
        if (typeof answer !== 'object') return false;
        return Object.keys(correctPairs).every(leftIdx => 
          String(answer[leftIdx]) === String(correctPairs[leftIdx])
        );

      default:
        return false;
    }
  }

  /**
   * 🎯 Obtener la respuesta correcta de una pregunta
   */
  private getCorrectAnswer(question: any): any {
    return question.respuesta_correcta;
  }

  /**
   * 📊 Actualizar y ordenar leaderboard
   */
  private async updateLeaderboard(roomCode: string): Promise<void> {
    const gameState = this.activeGames.get(roomCode);
    if (!gameState) return;

    // Ordenar por score descendente
    gameState.leaderboard.sort((a, b) => b.score - a.score);

    // Asignar ranks
    gameState.leaderboard.forEach((player, index) => {
      player.rank = index + 1;
    });

    await this.saveGameStateToRedis(roomCode, gameState);
  }

  /**
   * 🏆 Obtener top N del leaderboard
   */
  private getTopLeaderboard(gameState: GameState, limit: number): PlayerScore[] {
    return gameState.leaderboard
      .slice(0, limit)
      .map(p => ({
        ...p,
        // No enviar datos sensibles si hay
      }));
  }

  /**
   * 🏁 Obtener leaderboard final ordenado
   */
  private getFinalLeaderboard(gameState: GameState): PlayerScore[] {
    return [...gameState.leaderboard].sort((a, b) => {
      // Ordenar por score, luego por accuracy, luego por combo
      if (b.score !== a.score) return b.score - a.score;
      
      const accA = calculateAccuracy(a.correctAnswers, a.totalAnswered);
      const accB = calculateAccuracy(b.correctAnswers, b.totalAnswered);
      if (accB !== accA) return accB - accA;
      
      return b.comboStreak - a.comboStreak;
    });
  }

  /**
   * 💾 Guardar respuesta en la base de datos
   */
  private async saveAnswer(data: {
    playerId: string;
    questionId: string;
    answer: any;
    isCorrect: boolean;
    timeTaken: number;
    points: number;
    comboMultiplier: number;
  }): Promise<void> {
    // Obtener sala_id del participante
    const participante = await prisma.sala_participantes.findUnique({
      where: { id: data.playerId },
      select: { sala_id: true },
    });

    if (!participante?.sala_id) {
      throw new Error('Sala not found for participant');
    }

    // Calcular puntos base y velocidad
    const puntos_base = 1000;
    const puntos_velocidad = data.points - puntos_base;

    await prisma.sala_respuestas.create({
      data: {
        sala_id: participante.sala_id,
        participante_id: data.playerId,
        pregunta_id: data.questionId,
        respuesta: data.answer as any,
        correcta: data.isCorrect,
        tiempo_respuesta_ms: Math.round(data.timeTaken * 1000), // Convertir a ms
        puntos_base: puntos_base,
        puntos_velocidad: Math.max(0, puntos_velocidad),
        multiplicador: Math.round(data.comboMultiplier * 100), // Guardar como entero (1.5x = 150)
        puntos_totales: data.points,
      },
    });

    // Actualizar estadísticas de la pregunta
    await prisma.preguntas.update({
      where: { id: data.questionId },
      data: {
        veces_respondida: { increment: 1 },
        ...(data.isCorrect && { veces_correcta: { increment: 1 } }),
      },
    });

    // Actualizar stats del participante en tiempo real
    await prisma.sala_participantes.update({
      where: { id: data.playerId },
      data: {
        puntos_actuales: { increment: data.points },
        ...(data.isCorrect 
          ? { respuestas_correctas: { increment: 1 } } 
          : { respuestas_incorrectas: { increment: 1 } }
        ),
      },
    });
  }

  /**
   * 💾 Guardar resultado final del juego
   */
  private async saveGameResult(data: {
    playerId: string;
    roomCode: string;
    rank: number;
    score: number;
    accuracy: number;
    comboMax: number;
    correctAnswers: number;
    totalAnswered: number;
    rewards: any;
  }): Promise<void> {
    const salaId = await this.getSalaId(data.roomCode);

    // Determinar tipo de trofeo
    let trofeo_tipo = null;
    if (data.rank === 1) trofeo_tipo = 'oro';
    else if (data.rank === 2) trofeo_tipo = 'plata';
    else if (data.rank === 3) trofeo_tipo = 'bronce';

    await prisma.resultados_finales.create({
      data: {
        sala_id: salaId,
        participante_id: data.playerId,
        puntos_totales: data.score,
        posicion: data.rank,
        preguntas_respondidas: data.totalAnswered,
        respuestas_correctas: data.correctAnswers,
        respuestas_incorrectas: data.totalAnswered - data.correctAnswers,
        porcentaje_acierto: data.accuracy,
        experiencia_ganada: data.rewards.xp,
        copas_ganadas: data.rewards.trophies,
        trofeo_tipo: trofeo_tipo,
      },
    });
  }

  /**
   * 🎁 Otorgar recompensas al jugador
   */
  private async grantRewards(playerId: string, rewards: any, rank: number): Promise<void> {
    // Obtener usuario_id del participante
    const participante = await prisma.sala_participantes.findUnique({
      where: { id: playerId },
      select: { usuario_id: true },
    });

    if (!participante?.usuario_id) {
      // Jugador anónimo, no otorgar recompensas
      console.log(`⚠️ Player ${playerId} is anonymous, skipping rewards`);
      return;
    }

    const userId = participante.usuario_id;

    // Buscar o crear perfil gamer
    let perfil = await prisma.perfiles_gamer.findUnique({
      where: { usuario_id: userId },
    });

    if (!perfil) {
      // Crear perfil si no existe
      perfil = await prisma.perfiles_gamer.create({
        data: {
          usuario_id: userId,
          nivel: 1,
          experiencia: 0,
          puntos_totales: BigInt(0),
          copas: 0,
          trofeos_oro: 0,
          trofeos_plata: 0,
          trofeos_bronce: 0,
        },
      });
    }

    // Actualizar estadísticas del perfil
    const estadisticas = typeof perfil.estadisticas === 'object' ? perfil.estadisticas as any : {};
    
    await prisma.perfiles_gamer.update({
      where: { usuario_id: userId },
      data: {
        experiencia: { increment: rewards.xp },
        copas: { increment: rewards.trophies },
        // Incrementar trofeos según posición
        ...(rank === 1 && { trofeos_oro: { increment: 1 } }),
        ...(rank === 2 && { trofeos_plata: { increment: 1 } }),
        ...(rank === 3 && { trofeos_bronce: { increment: 1 } }),
        // Actualizar estadísticas JSON
        estadisticas: {
          ...estadisticas,
          juegos_jugados: (estadisticas.juegos_jugados || 0) + 1,
          victorias: (estadisticas.victorias || 0) + (rank === 1 ? 1 : 0),
          podios: (estadisticas.podios || 0) + (rank <= 3 ? 1 : 0),
        },
      },
    });

    console.log(`🎁 Rewards granted to user ${userId}: +${rewards.xp} XP, +${rewards.trophies} copas`);
  }

  /**
   * 🔍 Encontrar sala por ID de jugador
   */
  private async findRoomByPlayer(playerId: string): Promise<string | null> {
    const participante = await prisma.sala_participantes.findUnique({
      where: { id: playerId },
      include: { salas: true },
    });

    return participante?.salas?.codigo || null;
  }

  /**
   * 🔍 Obtener ID de sala por código
   */
  private async getSalaId(roomCode: string): Promise<string> {
    const sala = await prisma.salas.findUnique({
      where: { codigo: roomCode },
      select: { id: true },
    });

    if (!sala) {
      throw new Error('Sala not found');
    }

    return sala.id;
  }

  /**
   * 💾 Guardar estado del juego en Redis
   */
  private async saveGameStateToRedis(roomCode: string, gameState: GameState): Promise<void> {
    // Crear copia sin timers
    const stateToBeSaved = {
      ...gameState,
      timerInterval: null, // No guardar intervalos
    };

    await redis.set(
      `gamestate:${roomCode}`,
      JSON.stringify(stateToBeSaved),
      'EX',
      3600 // 1 hora
    );
  }

  /**
   * 🔄 Recuperar estado del juego desde Redis
   */
  async loadGameStateFromRedis(roomCode: string): Promise<GameState | null> {
    const cached = await redis.get(`gamestate:${roomCode}`);
    if (!cached) return null;

    const gameState = JSON.parse(cached) as GameState;
    gameState.answersReceived = new Set(Array.from(gameState.answersReceived || []));
    
    return gameState;
  }

  /**
   * 🧹 Limpiar timer de una sala
   */
  clearGameTimer(roomCode: string): void {
    const gameState = this.activeGames.get(roomCode);
    if (gameState?.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }
  }
}

export default new GameplayService();
