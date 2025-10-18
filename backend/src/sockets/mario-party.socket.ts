import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.types';
import marioPartyService, { CasillaType } from '../services/mario-party.service';
import roomManager from '../services/room.service';
import prisma from '../config/database';

export function setupMarioPartyHandlers(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    
    /**
     * Iniciar juego Mario Party
     */
    socket.on('mario:start_game', async (payload: {
      roomCode: string;
      boardId: string;
    }, callback) => {
      try {
        const { roomCode, boardId } = payload;
        
        // Verificar que es el profesor
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        if (room.teacherId !== socket.userId) {
          return callback?.({
            success: false,
            message: 'Solo el profesor puede iniciar el juego'
          });
        }

        // Obtener sala de BD
        const salaDB = await prisma.salas.findUnique({
          where: { codigo: roomCode }
        });

        if (!salaDB) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada en BD'
          });
        }

        // Obtener participantes
        const participantes = await prisma.sala_participantes.findMany({
          where: { 
            sala_id: salaDB.id
          }
        });

        const players = participantes.map(p => ({
          id: p.id,
          participante_id: p.id,
          nickname: p.nickname || 'Jugador',
          avatar: p.avatar || '🎮'
        }));

        // Inicializar juego - Pasar el UUID de la sala de BD
        const gameState = await marioPartyService.initializeGame(
          roomCode,
          salaDB.id, // UUID de la sala para BD
          boardId,
          players
        );

        // Notificar a todos
        io.to(`game:${roomCode}`).emit('mario:game_started', {
          gameState,
          boardId
        });

        callback?.({
          success: true,
          gameState
        });
      } catch (error: any) {
        console.error('Error starting Mario Party:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Lanzar dado
     */
    socket.on('mario:roll_dice', async (payload: {
      roomCode: string;
      playerId: string;
    }, callback) => {
      try {
        const { roomCode, playerId } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Obtener sala de BD para UUID
        const salaDB = await prisma.salas.findUnique({
          where: { codigo: roomCode }
        });

        if (!salaDB) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada en BD'
          });
        }

        // Lanzar dado
        const diceRoll = await marioPartyService.rollDice(roomCode, salaDB.id, playerId);
        
        // Notificar a todos con animación de dado
        io.to(`game:${roomCode}`).emit('mario:dice_rolled', {
          playerId,
          result: diceRoll.result,
          timestamp: diceRoll.timestamp
        });

        callback?.({
          success: true,
          result: diceRoll.result
        });

        // Esperar un poco para la animación y luego mover
        setTimeout(async () => {
          // Mover jugador automáticamente
          const position = await marioPartyService.movePlayer(
            roomCode,
            playerId,
            diceRoll.result
          );

          // Notificar movimiento
          io.to(`game:${roomCode}`).emit('mario:player_moved', {
            playerId,
            from: position.old_position,
            to: position.new_position,
            steps: diceRoll.result
          });

          // Manejar evento de casilla
          const casillaEvent = await marioPartyService.handleCasilla(
            roomCode,
            playerId,
            position.casilla_type
          );

          // Notificar evento de casilla
          io.to(`game:${roomCode}`).emit('mario:casilla_event', {
            playerId,
            casilla: position.new_position,
            tipo: position.casilla_type,
            evento: casillaEvent
          });

        }, 2000); // 2 segundos para animación de dado

      } catch (error: any) {
        console.error('Error rolling dice:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Mover jugador (después del dado)
     */
    socket.on('mario:move', async (payload: {
      roomCode: string;
      playerId: string;
      steps: number;
    }, callback) => {
      try {
        const { roomCode, playerId, steps } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Mover jugador
        const position = await marioPartyService.movePlayer(roomCode, playerId, steps);
        
        // Notificar movimiento a todos
        io.to(`game:${roomCode}`).emit('mario:player_moved', {
          playerId,
          from: position.old_position,
          to: position.new_position,
          steps
        });

        // Manejar evento de casilla
        const casillaEvent = await marioPartyService.handleCasilla(
          roomCode,
          playerId,
          position.casilla_type
        );

        // Notificar evento de casilla
        io.to(`game:${roomCode}`).emit('mario:casilla_event', {
          playerId,
          casilla: position.new_position,
          tipo: position.casilla_type,
          evento: casillaEvent
        });

        callback?.({
          success: true,
          position,
          evento: casillaEvent
        });

      } catch (error: any) {
        console.error('Error moving player:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Responder pregunta en casilla
     */
    socket.on('mario:answer_question', async (payload: {
      roomCode: string;
      playerId: string;
      questionId: string;
      answer: any,
      timeElapsed: number
    }, callback) => {
      try {
        const { roomCode, playerId, questionId, answer: _answer, timeElapsed } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Validar respuesta usando gameplay service
        // TODO: Implementar validateAnswer en gameplayService
        const isCorrect = true; // Por ahora siempre true
        // const isCorrect = await gameplayService.validateAnswer(
        //   questionId,
        //   answer
        // );

        // Si es correcta, manejar según tipo de casilla
        if (isCorrect) {
          const gameState = await marioPartyService.getGameState(roomCode);
          const player = gameState?.players.find(p => p.player_id === playerId);
          
          if (player) {
            // Buscar tipo de casilla actual
            const board = await prisma.tableros.findUnique({
              where: { id: gameState?.board_id }
            });
            
            const configCasillas = board?.config_casillas as any[];
            const casilla = configCasillas?.find(c => c.posicion === player.position);
            
            if (casilla?.tipo === CasillaType.PREGUNTA) {
              // En casilla pregunta: avanzar 2 casillas extra
              setTimeout(async () => {
                const bonusMove = await marioPartyService.movePlayer(roomCode, playerId, 2);
                io.to(`game:${roomCode}`).emit('mario:bonus_move', {
                  playerId,
                  from: bonusMove.old_position,
                  to: bonusMove.new_position,
                  reason: 'respuesta_correcta'
                });
              }, 1000);
            }
          }
        }

        // Notificar resultado
        io.to(`game:${roomCode}`).emit('mario:answer_result', {
          playerId,
          questionId,
          isCorrect,
          timeElapsed
        });

        callback?.({
          success: true,
          isCorrect
        });

      } catch (error: any) {
        console.error('Error answering question:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Mini-juego de estrella (3 preguntas)
     */
    socket.on('mario:star_minigame', async (payload: {
      roomCode: string;
      playerId: string;
      questionIndex: number;
      answer: any;
    }, callback) => {
      try {
        const { roomCode, playerId, questionIndex, answer: _answer } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Por ahora simplificado - validar respuesta
        const isCorrect = true; // TODO: Implementar validación real

        // Si completó las 3 preguntas correctamente, ganar estrella
        if (questionIndex === 2 && isCorrect) {
          await marioPartyService.awardStar(roomCode, playerId);
          
          io.to(`game:${roomCode}`).emit('mario:star_won', {
            playerId,
            message: '¡Ganaste una estrella!'
          });
        }

        callback?.({
          success: true,
          isCorrect,
          questionIndex
        });

      } catch (error: any) {
        console.error('Error in star minigame:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Seleccionar oponente para duelo
     */
    socket.on('mario:select_duel_opponent', async (payload: {
      roomCode: string;
      challengerId: string;
      opponentId: string;
    }, callback) => {
      try {
        const { roomCode, challengerId, opponentId } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Notificar inicio de duelo
        io.to(`game:${roomCode}`).emit('mario:duel_started', {
          challengerId,
          opponentId,
          message: '¡Duelo iniciado!'
        });

        callback?.({
          success: true
        });

      } catch (error: any) {
        console.error('Error selecting duel opponent:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Resultado del duelo
     */
    socket.on('mario:duel_result', async (payload: {
      roomCode: string;
      challengerId: string;
      opponentId: string;
      winnerId: string;
    }, callback) => {
      try {
        const { roomCode, challengerId, opponentId, winnerId } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Manejar resultado del duelo
        const result = await marioPartyService.handleDuel(
          roomCode,
          challengerId,
          opponentId,
          winnerId
        );

        // Notificar resultado
        io.to(`game:${roomCode}`).emit('mario:duel_finished', {
          winner: result.winner,
          loser: result.loser,
          starTransferred: result.star_transferred
        });

        callback?.({
          success: true,
          result
        });

      } catch (error: any) {
        console.error('Error handling duel result:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Cambiar turno
     */
    socket.on('mario:next_turn', async (payload: {
      roomCode: string;
    }, callback) => {
      try {
        const { roomCode } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Cambiar al siguiente turno
        const nextPlayer = await marioPartyService.nextTurn(roomCode);

        if (!nextPlayer) {
          // Juego terminado
          const finalScores = await marioPartyService.calculateFinalScores(roomCode);
          
          io.to(`game:${roomCode}`).emit('mario:game_finished', {
            rankings: finalScores
          });
          
          callback?.({
            success: true,
            gameFinished: true,
            rankings: finalScores
          });
        } else {
          // Notificar cambio de turno
          io.to(`game:${roomCode}`).emit('mario:turn_changed', {
            currentPlayer: nextPlayer,
            message: `Turno de ${nextPlayer.nickname}`
          });

          callback?.({
            success: true,
            nextPlayer
          });
        }

      } catch (error: any) {
        console.error('Error changing turn:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Obtener estado actual del juego
     */
    socket.on('mario:get_state', async (payload: {
      roomCode: string;
    }, callback) => {
      try {
        const { roomCode } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        const gameState = await marioPartyService.getGameState(roomCode);
        
        callback?.({
          success: true,
          gameState
        });

      } catch (error: any) {
        console.error('Error getting game state:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Forzar siguiente turno (profesor)
     */
    socket.on('mario:force_next_turn', async (payload: {
      roomCode: string;
    }) => {
      try {
        const { roomCode } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return;
        }

        // Verificar que es el profesor
        if (room.teacherId !== socket.userId) {
          return;
        }

        // Cambiar al siguiente turno
        const nextPlayer = await marioPartyService.nextTurn(roomCode);

        if (nextPlayer) {
          io.to(`game:${roomCode}`).emit('mario:turn_changed', {
            currentPlayer: nextPlayer,
            message: `Turno forzado a ${nextPlayer.nickname}`
          });
        }
      } catch (error: any) {
        console.error('Error forcing next turn:', error);
      }
    });

    /**
     * Terminar juego (profesor)
     */
    socket.on('mario:end_game', async (payload: {
      roomCode: string;
    }, callback) => {
      try {
        const { roomCode } = payload;
        
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada'
          });
        }

        // Verificar que es el profesor
        if (room.teacherId !== socket.userId) {
          return callback?.({
            success: false,
            message: 'Solo el profesor puede terminar el juego'
          });
        }

        // Calcular puntajes finales
        const finalScores = await marioPartyService.calculateFinalScores(roomCode);
        
        // Notificar a todos que el juego terminó
        io.to(`game:${roomCode}`).emit('mario:game_finished', {
          rankings: finalScores,
          message: 'El profesor ha terminado el juego'
        });

        // Limpiar estado del juego
        await marioPartyService.clearGameState(roomCode);

        callback?.({
          success: true,
          rankings: finalScores
        });

      } catch (error: any) {
        console.error('Error ending game:', error);
        callback?.({
          success: false,
          message: error.message
        });
      }
    });
  });
}

export default setupMarioPartyHandlers;
