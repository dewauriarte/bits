import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, JoinRoomPayload, PlayerReadyPayload, StartGamePayload, AnswerSubmitPayload } from '../types/socket.types';
import roomManager from '../services/room.service';
import gameplayService from '../services/gameplay.service';

export function setupGameSocketHandlers(io: SocketIOServer) {
  // Configurar RoomManager y GameplayService con IO
  roomManager.setIO(io);
  gameplayService.setIO(io);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🎮 Game socket connected: ${socket.id}`);

    /**
     * Evento: teacher:join - Profesor se une a la sala como observador
     */
    socket.on('teacher:join', async (payload: { roomCode: string }, callback) => {
      try {
        const { roomCode } = payload;
        const teacherId = socket.userId;

        if (!teacherId) {
          return callback?.({
            success: false,
            message: 'No autenticado',
          });
        }

        // Validar que la sala existe
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada',
          });
        }

        // Validar que es el profesor de esta sala
        if (room.teacherId !== teacherId) {
          return callback?.({
            success: false,
            message: 'No eres el profesor de esta sala',
          });
        }

        // Unir socket al room sin agregarlo como jugador
        await socket.join(`game:${roomCode}`);
        (socket as any).currentRoom = roomCode;
        (socket as any).isTeacher = true;

        callback?.({
          success: true,
          data: { room },
        });

        console.log(`👨‍🏫 Teacher joined room ${roomCode} as observer`);
      } catch (error: any) {
        console.error('Error teacher joining:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al unirse',
        });
      }
    });

    /**
     * Evento: game:join - Estudiante se une a la sala
     */
    socket.on('game:join', async (payload: JoinRoomPayload, callback) => {
      try {
        const { roomCode, nickname, avatar, participantId } = payload;

        if (!roomCode || !nickname) {
          return callback?.({
            success: false,
            message: 'Código de sala y nickname son requeridos',
          });
        }

        // Validar que la sala exists
        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return callback?.({
            success: false,
            message: 'Sala no encontrada',
          });
        }

        // Agregar jugador a la sala
        const { player, isReconnect } = await roomManager.joinRoom(
          roomCode,
          socket.userId || null,
          nickname,
          avatar || '👤',
          participantId // Pasar ID de participante pre-cargado
        );

        // Unir socket a la room
        await socket.join(`game:${roomCode}`);

        // Guardar roomCode en el socket
        (socket as any).currentRoom = roomCode;
        (socket as any).playerId = player.id;

        // Solo notificar si es nuevo jugador (no reconexión)
        if (!isReconnect) {
          socket.to(`game:${roomCode}`).emit('player:joined', {
            player,
          });
        }

        // Enviar estado actualizado al jugador que se unió
        const updatedRoom = await roomManager.getRoomState(roomCode);
        callback?.({
          success: true,
          data: {
            room: updatedRoom,
            playerId: player.id,
          },
        });

        // Broadcast room:updated a todos
        io.to(`game:${roomCode}`).emit('room:updated', {
          room: updatedRoom,
        });

        const action = isReconnect ? 'reconnected to' : 'joined';
        console.log(`✅ Player ${nickname} ${action} game ${roomCode}`);
      } catch (error: any) {
        console.error('Error joining game:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al unirse al juego',
        });
      }
    });

    /**
     * Evento: game:ready - Jugador marca listo/no listo
     */
    socket.on('game:ready', async (payload: PlayerReadyPayload, callback) => {
      try {
        const { roomCode } = payload;
        const playerId = (socket as any).playerId;

        if (!playerId) {
          return callback?.({
            success: false,
            message: 'No estás en ninguna sala',
          });
        }

        const isReady = await roomManager.togglePlayerReady(roomCode, playerId);

        // Broadcast a todos
        io.to(`game:${roomCode}`).emit('player:ready', {
          playerId,
          isReady,
        });

        const updatedRoom = await roomManager.getRoomState(roomCode);
        io.to(`game:${roomCode}`).emit('room:updated', {
          room: updatedRoom,
        });

        callback?.({
          success: true,
          data: { isReady },
        });

        console.log(`✅ Player ${playerId} ready status: ${isReady}`);
      } catch (error: any) {
        console.error('Error updating ready status:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al cambiar estado',
        });
      }
    });

    /**
     * Evento: game:start - Profesor inicia el juego
     */
    socket.on('game:start', async (payload: StartGamePayload, callback) => {
      try {
        const { roomCode } = payload;
        const teacherId = socket.userId;

        if (!teacherId) {
          return callback?.({
            success: false,
            message: 'No autenticado',
          });
        }

        // Validar que es el profesor
        const room = await roomManager.getRoomState(roomCode);
        if (!room || room.teacherId !== teacherId) {
          return callback?.({
            success: false,
            message: 'Solo el profesor puede iniciar el juego',
          });
        }

        // Iniciar juego
        await roomManager.startGame(roomCode, teacherId);

        // Broadcast game:starting
        io.to(`game:${roomCode}`).emit('game:starting', {
          message: 'El juego está comenzando...',
        });

        // Countdown 3-2-1-GO!
        await sleep(1000);
        io.to(`game:${roomCode}`).emit('game:countdown', { count: 3, message: '3' });

        await sleep(1000);
        io.to(`game:${roomCode}`).emit('game:countdown', { count: 2, message: '2' });

        await sleep(1000);
        io.to(`game:${roomCode}`).emit('game:countdown', { count: 1, message: '1' });

        await sleep(1000);
        io.to(`game:${roomCode}`).emit('game:countdown', { count: 0, message: '¡GO!' });

        // Activar juego
        await roomManager.activateGame(roomCode);

        // Enviar evento game:started
        await sleep(500);
        io.to(`game:${roomCode}`).emit('game:started', {
          message: 'El juego ha comenzado',
        });

        // Inicializar gameplay (cargar preguntas)
        await gameplayService.initializeGame(roomCode, room.quizId, room.config.timePerQuestion || 20);

        // Esperar 2 segundos antes de enviar primera pregunta
        await sleep(2000);

        // Enviar primera pregunta
        await gameplayService.sendQuestion(roomCode);

        callback?.({
          success: true,
          message: 'Juego iniciado',
        });

        console.log(`✅ Game started in room ${roomCode}`);
      } catch (error: any) {
        console.error('Error starting game:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al iniciar el juego',
        });
      }
    });

    /**
     * Evento: game:leave - Jugador abandona voluntariamente
     */
    socket.on('game:leave', async (callback) => {
      try {
        const roomCode = (socket as any).currentRoom;
        const playerId = (socket as any).playerId;

        if (!roomCode || !playerId) {
          return callback?.({
            success: false,
            message: 'No estás en ninguna sala',
          });
        }

        await roomManager.leaveRoom(roomCode, playerId);

        // Notificar a los demás
        socket.to(`game:${roomCode}`).emit('player:left', {
          playerId,
        });

        const updatedRoom = await roomManager.getRoomState(roomCode);
        io.to(`game:${roomCode}`).emit('room:updated', {
          room: updatedRoom,
        });

        // Salir del room
        socket.leave(`game:${roomCode}`);
        (socket as any).currentRoom = null;
        (socket as any).playerId = null;

        callback?.({
          success: true,
          message: 'Has salido de la sala',
        });

        console.log(`✅ Player ${playerId} left game ${roomCode}`);
      } catch (error: any) {
        console.error('Error leaving game:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al salir de la sala',
        });
      }
    });

    /**
     * Evento: disconnect - Desconexión del socket
     */
    socket.on('disconnect', async (reason) => {
      try {
        const roomCode = (socket as any).currentRoom;
        const playerId = (socket as any).playerId;
        const userId = socket.userId;

        console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);

        if (!roomCode) {
          return;
        }

        const room = await roomManager.getRoomState(roomCode);
        if (!room) {
          return;
        }

        // Si es un estudiante, removerlo
        if (playerId) {
          await roomManager.leaveRoom(roomCode, playerId);

          socket.to(`game:${roomCode}`).emit('player:disconnected', {
            playerId,
          });

          const updatedRoom = await roomManager.getRoomState(roomCode);
          io.to(`game:${roomCode}`).emit('room:updated', {
            room: updatedRoom,
          });
        }

        // Si es el profesor
        if (userId === room.teacherId) {
          if (room.status === 'lobby') {
            // Si está en lobby, cancelar el juego
            io.to(`game:${roomCode}`).emit('game:cancelled', {
              message: 'El profesor se ha desconectado. La sala ha sido cancelada.',
            });

            await roomManager.closeRoom(roomCode, userId);
          } else if (room.status === 'active') {
            // Si está activo, pausar el juego
            io.to(`game:${roomCode}`).emit('game:paused', {
              message: 'El profesor se ha desconectado. El juego ha sido pausado.',
            });
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    /**
     * Evento: answer:submit - Jugador envía una respuesta
     */
    socket.on('answer:submit', async (payload: AnswerSubmitPayload, callback) => {
      try {
        const { roomCode, questionId, answer, timeTaken } = payload;
        const playerId = (socket as any).playerId;

        if (!playerId) {
          return callback?.({
            success: false,
            message: 'No estás en ninguna sala',
          });
        }

        // Procesar respuesta
        const result = await gameplayService.processAnswer({
          playerId,
          questionId,
          answer,
          timeTaken,
        });

        // Obtener player score actualizado
        const gameState = await gameplayService.loadGameStateFromRedis(roomCode);
        const playerScore = gameState?.leaderboard.find(p => p.playerId === playerId);

        // Enviar resultado al jugador
        callback?.({
          success: true,
          data: {
            ...result,
            newScore: playerScore?.score || 0,
            newRank: playerScore?.rank || 0,
          },
        });

        console.log(`✅ Answer processed for player ${playerId}: ${result.isCorrect ? 'Correct' : 'Wrong'} (+${result.points} points)`);
      } catch (error: any) {
        console.error('Error processing answer:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al procesar respuesta',
        });
      }
    });

    /**
     * Evento: game:close - Profesor cierra la sala
     */
    socket.on('game:close', async (payload: { roomCode: string }, callback) => {
      try {
        const { roomCode } = payload;
        const teacherId = socket.userId;

        if (!teacherId) {
          return callback?.({
            success: false,
            message: 'No autenticado',
          });
        }

        await roomManager.closeRoom(roomCode, teacherId);

        callback?.({
          success: true,
          message: 'Sala cerrada',
        });

        console.log(`✅ Room ${roomCode} closed by teacher`);
      } catch (error: any) {
        console.error('Error closing room:', error);
        callback?.({
          success: false,
          message: error.message || 'Error al cerrar la sala',
        });
      }
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
