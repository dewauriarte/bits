import { Server } from 'socket.io';
import Redis from 'ioredis';
import prisma from '../config/database';

// Interfaces para el estado del juego
export interface MarioPartyState {
  room_id: string;
  board_id: string;
  players: PlayerState[];
  current_turn: string; // player_id
  round: number;
  max_rounds: number;
  estrellas_posiciones: StarPosition[];
  eventos_activos: Event[];
  game_started: boolean;
}

export interface PlayerState {
  player_id: string;
  nickname: string;
  avatar: string;
  position: number; // casilla actual
  estrellas: number;
  monedas: number;
  items: Item[];
  turno_perdido?: boolean;
}

export interface StarPosition {
  posicion: number;
  activa: boolean;
}

export interface Item {
  id: string;
  nombre: string;
  tipo: string;
}

export interface Event {
  id: string;
  tipo: string;
  descripcion: string;
  activo: boolean;
}

export interface DiceRoll {
  player_id: string;
  result: number;
  timestamp: Date;
}

export interface Position {
  player_id: string;
  old_position: number;
  new_position: number;
  casilla_type: CasillaType;
}

export enum CasillaType {
  NORMAL = 'normal',
  PREGUNTA = 'pregunta',
  ESTRELLA = 'estrella',
  DUELO = 'duelo',
  EVENTO = 'evento',
  TRAMPA = 'trampa'
}

export class MarioPartyService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  setIO(_io: Server) {
    // IO is set but not used directly in this service
  }

  /**
   * Obtener UUID de la sala desde el código de sala
   */
  private async getSalaUUID(roomCode: string): Promise<string> {
    const sala = await prisma.salas.findUnique({
      where: { codigo: roomCode }
    });
    
    if (!sala) {
      throw new Error('Sala no encontrada');
    }
    
    return sala.id;
  }

  /**
   * Inicializar juego Mario Party
   */
  async initializeGame(
    roomId: string, 
    salaUUID: string, // UUID de la sala en la BD
    boardId: string, 
    players: any[]
  ): Promise<MarioPartyState> {
    try {
      // Obtener información del tablero
      const board = await prisma.tableros.findUnique({
        where: { id: boardId }
      });

      if (!board) {
        throw new Error('Tablero no encontrado');
      }

      // Eliminar jugadores duplicados por ID
      const uniquePlayers = players.filter((player, index, self) =>
        index === self.findIndex((p) => p.id === player.id)
      );

      console.log(`🎮 Iniciando con ${uniquePlayers.length} jugadores únicos (de ${players.length} totales)`);

      // Crear estado inicial
      const initialState: MarioPartyState = {
        room_id: roomId,
        board_id: boardId,
        players: uniquePlayers.map((player) => ({
          player_id: player.id,
          nickname: player.nickname,
          avatar: player.avatar,
          position: 1, // Todos empiezan en casilla 1 (primera casilla)
          estrellas: 0,
          monedas: 10, // Monedas iniciales
          items: [],
          turno_perdido: false
        })),
        current_turn: uniquePlayers[0].id, // Primer jugador empieza
        round: 1,
        max_rounds: 15, // Por defecto 15 rondas
        estrellas_posiciones: board.posiciones_estrellas?.map(pos => ({
          posicion: pos,
          activa: true
        })) || [],
        eventos_activos: [],
        game_started: true
      };

      // Guardar en Redis
      await this.redis.set(
        `mario_party:${roomId}`,
        JSON.stringify(initialState),
        'EX',
        86400 // 24 horas
      );

      // Guardar en BD
      await prisma.mario_party_estado.create({
        data: {
          sala_id: salaUUID, // UUID de la sala, no el roomCode
          tablero_id: boardId,
          ronda_actual: 1,
          rondas_totales: 15,
          jugador_turno_id: uniquePlayers[0].participante_id,
          estrellas_disponibles: JSON.stringify(initialState.estrellas_posiciones),
          eventos_activos: []
        }
      });

      return initialState;
    } catch (error) {
      console.error('Error initializing Mario Party game:', error);
      throw error;
    }
  }

  /**
   * Lanzar dado
   */
  async rollDice(roomId: string, salaUUID: string, playerId: string): Promise<DiceRoll> {
    try {
      const state = await this.getGameState(roomId);
      
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      // Verificar que es el turno del jugador
      if (state.current_turn !== playerId) {
        throw new Error('No es tu turno');
      }

      // Generar número aleatorio 1-6
      const result = Math.floor(Math.random() * 6) + 1;

      // Crear evento de dado
      const diceRoll: DiceRoll = {
        player_id: playerId,
        result,
        timestamp: new Date()
      };

      // Guardar evento en BD
      await prisma.mario_party_eventos.create({
        data: {
          sala_id: salaUUID, // UUID de la sala, no el roomCode
          participante_id: playerId,
          ronda: state.round,
          tipo_evento: 'lanzar_dado', // Debe coincidir con el CHECK constraint de la BD
          detalles: {
            result,
            timestamp: new Date()
          }
        }
      });

      return diceRoll;
    } catch (error) {
      console.error('Error rolling dice:', error);
      throw error;
    }
  }

  /**
   * Mover jugador
   */
  async movePlayer(
    roomId: string, 
    playerId: string, 
    steps: number
  ): Promise<Position> {
    try {
      const state = await this.getGameState(roomId);
      
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      // Obtener información del tablero
      const board = await prisma.tableros.findUnique({
        where: { id: state.board_id }
      });

      if (!board) {
        throw new Error('Tablero no encontrado');
      }

      // Encontrar al jugador
      const playerIndex = state.players.findIndex(p => p.player_id === playerId);
      if (playerIndex === -1) {
        throw new Error('Jugador no encontrado');
      }

      const player = state.players[playerIndex];
      const oldPosition = player.position;
      
      // Calcular nueva posición (circular)
      let newPosition = (oldPosition + steps) % board.total_casillas;
      if (newPosition === 0 && steps > 0) {
        newPosition = board.total_casillas; // Última casilla
      }

      // Actualizar posición del jugador
      state.players[playerIndex].position = newPosition;

      // Obtener tipo de casilla
      const configCasillas = board.config_casillas as any[];
      const casilla = configCasillas.find(c => c.posicion === newPosition);
      const casillaType = casilla?.tipo || CasillaType.NORMAL;

      // Actualizar estado en Redis
      await this.updateGameState(roomId, state);

      // Obtener UUID de la sala
      const salaUUID = await this.getSalaUUID(roomId);

      // Guardar evento en BD
      await prisma.mario_party_eventos.create({
        data: {
          sala_id: salaUUID,
          participante_id: playerId,
          ronda: state.round,
          tipo_evento: 'mover_ficha', // Debe coincidir con el CHECK constraint
          detalles: {
            old_position: oldPosition,
            new_position: newPosition,
            steps,
            casilla_type: casillaType
          }
        }
      });

      return {
        player_id: playerId,
        old_position: oldPosition,
        new_position: newPosition,
        casilla_type: casillaType as CasillaType
      };
    } catch (error) {
      console.error('Error moving player:', error);
      throw error;
    }
  }

  /**
   * Manejar evento de casilla
   */
  async handleCasilla(
    roomId: string, 
    playerId: string, 
    casillaType: CasillaType
  ): Promise<any> {
    try {
      const state = await this.getGameState(roomId);
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      const playerIndex = state.players.findIndex(p => p.player_id === playerId);
      if (playerIndex === -1) {
        throw new Error('Jugador no encontrado');
      }

      let eventResult: any = {
        tipo: casillaType,
        jugador: playerId
      };

      switch (casillaType) {
        case CasillaType.NORMAL:
          // No hace nada especial
          eventResult.descripcion = 'Casilla normal';
          break;

        case CasillaType.PREGUNTA:
          // Preparar pregunta única
          eventResult.descripcion = 'Responde la pregunta';
          eventResult.accion = 'show_question';
          break;

        case CasillaType.ESTRELLA:
          // Mini-juego de 3 preguntas
          eventResult.descripcion = 'Mini-juego de estrella';
          eventResult.accion = 'star_minigame';
          break;

        case CasillaType.EVENTO:
          // Evento aleatorio
          const eventos = [
            { tipo: 'ganar_monedas', cantidad: 5, descripcion: '¡Ganaste 5 monedas!' },
            { tipo: 'perder_monedas', cantidad: 3, descripcion: 'Perdiste 3 monedas' },
            { tipo: 'avanzar', casillas: 2, descripcion: 'Avanza 2 casillas' },
            { tipo: 'retroceder', casillas: 2, descripcion: 'Retrocede 2 casillas' }
          ];
          const evento = eventos[Math.floor(Math.random() * eventos.length)];
          eventResult.evento = evento;
          eventResult.descripcion = evento.descripcion;
          
          // Aplicar evento
          if (evento.tipo === 'ganar_monedas' && evento.cantidad) {
            state.players[playerIndex].monedas += evento.cantidad;
          } else if (evento.tipo === 'perder_monedas' && evento.cantidad) {
            state.players[playerIndex].monedas = Math.max(0, state.players[playerIndex].monedas - evento.cantidad);
          }
          
          await this.updateGameState(roomId, state);
          break;

        case CasillaType.TRAMPA:
          // Pierde turno
          state.players[playerIndex].turno_perdido = true;
          eventResult.descripcion = '¡Trampa! Pierdes tu próximo turno';
          await this.updateGameState(roomId, state);
          break;

        case CasillaType.DUELO:
          // Preparar duelo
          eventResult.descripcion = 'Elige un oponente para el duelo';
          eventResult.accion = 'select_opponent';
          break;
      }

      // Obtener UUID de la sala
      const salaUUID = await this.getSalaUUID(roomId);

      // Guardar evento en BD
      await prisma.mario_party_eventos.create({
        data: {
          sala_id: salaUUID,
          participante_id: playerId,
          ronda: state.round,
          tipo_evento: 'caer_casilla', // Usar tipo genérico del CHECK constraint
          detalles: eventResult
        }
      });

      return eventResult;
    } catch (error) {
      console.error('Error handling casilla:', error);
      throw error;
    }
  }

  /**
   * Siguiente turno
   */
  async nextTurn(roomId: string): Promise<PlayerState | null> {
    try {
      const state = await this.getGameState(roomId);
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      // Encontrar índice del jugador actual
      const currentIndex = state.players.findIndex(p => p.player_id === state.current_turn);
      if (currentIndex === -1) {
        throw new Error('Jugador actual no encontrado');
      }

      // Buscar siguiente jugador (saltando los que perdieron turno)
      let nextIndex = (currentIndex + 1) % state.players.length;
      let attempts = 0;
      
      while (attempts < state.players.length) {
        const nextPlayer = state.players[nextIndex];
        
        if (nextPlayer.turno_perdido) {
          // Limpiar flag de turno perdido
          state.players[nextIndex].turno_perdido = false;
          nextIndex = (nextIndex + 1) % state.players.length;
        } else {
          break;
        }
        attempts++;
      }

      // Si completamos una vuelta, incrementar ronda
      if (nextIndex === 0) {
        state.round++;
        
        // Verificar si el juego terminó
        if (state.round > state.max_rounds) {
          // Calcular ganador y finalizar
          return null;
        }
      }

      // Actualizar turno
      state.current_turn = state.players[nextIndex].player_id;
      await this.updateGameState(roomId, state);

      // Obtener UUID de la sala
      const salaUUID = await this.getSalaUUID(roomId);

      // Actualizar BD
      await prisma.mario_party_estado.updateMany({
        where: { sala_id: salaUUID },
        data: {
          jugador_turno_id: state.players[nextIndex].player_id,
          ronda_actual: state.round,
          fecha_actualizacion: new Date()
        }
      });

      return state.players[nextIndex];
    } catch (error) {
      console.error('Error changing turn:', error);
      throw error;
    }
  }

  /**
   * Limpiar estado del juego
   */
  async clearGameState(roomId: string): Promise<void> {
    try {
      // Eliminar de Redis
      await this.redis.del(`mario_party:${roomId}`);
      
      // Obtener UUID de la sala
      const salaUUID = await this.getSalaUUID(roomId);
      
      // También podrías actualizar el estado en la BD a "terminado"
      await prisma.mario_party_estado.updateMany({
        where: { sala_id: salaUUID },
        data: { 
          eventos_activos: [],
          // Podrías agregar un campo "terminado" o "activo" si existe
        }
      });
      
      console.log(`✅ Estado del juego limpiado para sala ${roomId}`);
    } catch (error) {
      console.error('Error clearing game state:', error);
    }
  }

  /**
   * Calcular puntuaciones finales
   */
  async calculateFinalScores(roomId: string): Promise<any[]> {
    try {
      const state = await this.getGameState(roomId);
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      // Calcular puntuación: estrellas * 100 + monedas
      const rankings = state.players
        .map(player => ({
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          estrellas: player.estrellas,
          monedas: player.monedas,
          puntuacion_final: (player.estrellas * 100) + player.monedas,
          position: player.position
        }))
        .sort((a, b) => b.puntuacion_final - a.puntuacion_final)
        .map((player, index) => ({
          ...player,
          rank: index + 1
        }));

      // Obtener UUID de la sala
      const salaUUID = await this.getSalaUUID(roomId);

      // Guardar resultados en BD
      for (const ranking of rankings) {
        await prisma.resultados_finales.create({
          data: {
            sala_id: salaUUID,
            participante_id: ranking.player_id,
            puntos_totales: ranking.puntuacion_final,
            posicion: ranking.rank,
            tiempo_total_juego: 0, // No aplica en Mario Party
            respuestas_correctas: ranking.estrellas, // Usamos estrellas como métrica
            preguntas_respondidas: state.max_rounds
          }
        });
      }

      return rankings;
    } catch (error) {
      console.error('Error calculating final scores:', error);
      throw error;
    }
  }

  /**
   * Obtener estado del juego desde Redis
   */
  async getGameState(roomId: string): Promise<MarioPartyState | null> {
    try {
      const stateStr = await this.redis.get(`mario_party:${roomId}`);
      if (!stateStr) return null;
      return JSON.parse(stateStr);
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  /**
   * Actualizar estado del juego en Redis
   */
  private async updateGameState(roomId: string, state: MarioPartyState): Promise<void> {
    try {
      await this.redis.set(
        `mario_party:${roomId}`,
        JSON.stringify(state),
        'EX',
        86400 // 24 horas
      );
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  /**
   * Ganar estrella
   */
  async awardStar(roomId: string, playerId: string): Promise<void> {
    try {
      const state = await this.getGameState(roomId);
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      const playerIndex = state.players.findIndex(p => p.player_id === playerId);
      if (playerIndex !== -1) {
        state.players[playerIndex].estrellas++;
        await this.updateGameState(roomId, state);
      }
    } catch (error) {
      console.error('Error awarding star:', error);
      throw error;
    }
  }

  /**
   * Manejar duelo entre jugadores
   */
  async handleDuel(
    roomId: string, 
    challengerId: string, 
    opponentId: string,
    winnerId: string
  ): Promise<any> {
    try {
      const state = await this.getGameState(roomId);
      if (!state) {
        throw new Error('Estado del juego no encontrado');
      }

      const winnerIndex = state.players.findIndex(p => p.player_id === winnerId);
      const loserIndex = state.players.findIndex(p => 
        p.player_id === (winnerId === challengerId ? opponentId : challengerId)
      );

      if (winnerIndex === -1 || loserIndex === -1) {
        throw new Error('Jugadores no encontrados');
      }

      // Si el perdedor tiene estrellas, transferir una al ganador
      if (state.players[loserIndex].estrellas > 0) {
        state.players[loserIndex].estrellas--;
        state.players[winnerIndex].estrellas++;
      }

      await this.updateGameState(roomId, state);

      return {
        winner: state.players[winnerIndex],
        loser: state.players[loserIndex],
        star_transferred: state.players[loserIndex].estrellas >= 0
      };
    } catch (error) {
      console.error('Error handling duel:', error);
      throw error;
    }
  }
}

export default new MarioPartyService();
