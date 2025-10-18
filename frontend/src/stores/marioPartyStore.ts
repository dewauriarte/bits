import { create } from 'zustand';
import gameSocket from '@/lib/socket';
import { 
  MarioPartyState, 
  PlayerState, 
  Board, 
  CasillaEvent 
} from '@/types/mario-party.types';
import { toast } from 'sonner';

interface MarioPartyStore {
  // Estado del juego
  gameState: MarioPartyState | null;
  board: Board | null;
  currentPlayer: PlayerState | null;
  myPlayerId: string | null;
  
  // Estados de UI
  isRollingDice: boolean;
  diceResult: number | null;
  isMoving: boolean;
  showCasillaEvent: boolean;
  currentEvent: CasillaEvent | null;
  animatedPositions: Record<string, number>; // Posiciones animadas de cada jugador
  
  // Acciones
  setGameState: (state: MarioPartyState) => void;
  setBoard: (board: Board) => void;
  setMyPlayerId: (id: string) => void;
  setCurrentPlayer: (player: PlayerState | null) => void;
  setDiceResult: (result: number | null) => void;
  setIsRollingDice: (rolling: boolean) => void;
  setIsMoving: (moving: boolean) => void;
  setShowCasillaEvent: (show: boolean) => void;
  setCurrentEvent: (event: CasillaEvent | null) => void;
  
  // Acciones del juego
  rollDice: () => void;
  movePlayer: (playerId: string, steps: number) => void;
  nextTurn: () => void;
  answerQuestion: (questionId: string, answer: any) => void;
  selectDuelOpponent: (opponentId: string) => void;
  
  // Socket listeners
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  
  // Helpers
  isMyTurn: () => boolean;
  getMyPlayer: () => PlayerState | null;
  reset: () => void;
  animateMovement: (playerId: string, startPos: number, steps: number) => void;
}

const initialState = {
  gameState: null,
  board: null,
  currentPlayer: null,
  myPlayerId: null,
  isRollingDice: false,
  diceResult: null,
  isMoving: false,
  showCasillaEvent: false,
  currentEvent: null,
  animatedPositions: {},
};

export const useMarioPartyStore = create<MarioPartyStore>((set, get) => ({
  ...initialState,

  // Setters básicos
  setGameState: (state) => set({ gameState: state }),
  setBoard: (board) => set({ board }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setDiceResult: (result) => set({ diceResult: result }),
  setIsRollingDice: (rolling) => set({ isRollingDice: rolling }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setShowCasillaEvent: (show) => set({ showCasillaEvent: show }),
  setCurrentEvent: (event) => set({ currentEvent: event }),

  // Acciones del juego
  rollDice: () => {
    const { myPlayerId } = get();
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !myPlayerId || !socket) {
      console.error('Cannot roll dice:', { roomCode, myPlayerId, socket: !!socket });
      return;
    }
    
    set({ isRollingDice: true });
    
    socket.emit('mario:roll_dice', {
      roomCode,
      playerId: myPlayerId
    }, (response: any) => {
      if (response.success) {
        console.log('🎲 Dado lanzado:', response.result);
      } else {
        toast.error(response.message || 'Error al lanzar el dado');
        set({ isRollingDice: false });
      }
    });
  },

  movePlayer: (playerId: string, steps: number) => {
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !socket) return;
    
    socket.emit('mario:move', {
      roomCode,
      playerId,
      steps
    });
  },

  nextTurn: () => {
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !socket) return;
    
    socket.emit('mario:next_turn', {
      roomCode
    }, (response: any) => {
      if (response.gameFinished) {
        console.log('🏁 Juego terminado:', response.rankings);
      }
    });
  },

  answerQuestion: (questionId: string, answer: any) => {
    const { myPlayerId } = get();
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !myPlayerId || !socket) return;
    
    socket.emit('mario:answer_question', {
      roomCode,
      playerId: myPlayerId,
      questionId,
      answer,
      timeElapsed: 0
    }, (response: any) => {
      if (response.success) {
        if (response.isCorrect) {
          toast.success('¡Respuesta correcta!');
        } else {
          toast.error('Respuesta incorrecta');
        }
      }
    });
  },

  selectDuelOpponent: (opponentId: string) => {
    const { myPlayerId } = get();
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !myPlayerId || !socket) return;
    
    socket.emit('mario:select_duel_opponent', {
      roomCode,
      challengerId: myPlayerId,
      opponentId
    });
  },

  performCasillaAction: (action: string, data?: any) => {
    const { myPlayerId } = get();
    const roomCode = localStorage.getItem('currentRoomCode');
    const socket = gameSocket.getSocket();
    
    if (!roomCode || !myPlayerId || !socket) return;
    
    socket.emit('mario:casilla_action', {
      roomCode,
      playerId: myPlayerId,
      action,
      data
    });
  },

  // Socket listeners
  // Función para animar el movimiento paso a paso
  animateMovement: (playerId: string, startPos: number, steps: number) => {
    let stepCount = 0;
    const { board } = get();
    if (!board) return;

    // Establecer posición inicial animada
    set(state => ({
      animatedPositions: {
        ...state.animatedPositions,
        [playerId]: startPos
      },
      isMoving: true
    }));

    const interval = setInterval(() => {
      stepCount++;
      
      // Calcular nueva posición (circular)
      const newPos = ((startPos + stepCount - 1) % board.total_casillas) + 1;
      
      // Actualizar posición animada
      set(state => ({
        animatedPositions: {
          ...state.animatedPositions,
          [playerId]: newPos
        }
      }));
      
      console.log(`🚶 Caminando - Paso ${stepCount} de ${steps}: Casilla ${newPos}`);
      
      // Sonido opcional de paso (si quieres agregar)
      // playStepSound();
      
      if (stepCount >= steps) {
        clearInterval(interval);
        console.log('✅ ¡Llegamos a la casilla!');
        // Finalizar animación
        setTimeout(() => {
          set({ isMoving: false });
        }, 300);
      }
    }, 800); // 800ms por paso - más lento para que los niños puedan seguir el movimiento
  },

  initializeSocketListeners: () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;

    // Juego iniciado
    socket.on('mario:game_started', (data: { gameState: MarioPartyState, boardId: string }) => {
      console.log('🎮 Mario Party iniciado:', data);
      
      // Inicializar posiciones animadas
      const initialPositions: Record<string, number> = {};
      data.gameState.players.forEach(p => {
        initialPositions[p.player_id] = p.position;
      });
      
      set({ 
        gameState: data.gameState,
        currentPlayer: data.gameState.players.find(p => p.player_id === data.gameState.current_turn) || null,
        animatedPositions: initialPositions
      });
      toast.success('¡El juego ha comenzado!');
    });

    // Dado lanzado
    socket.on('mario:dice_rolled', (data: any) => {
      console.log('🎲 Dado lanzado:', data);
      
      set({ 
        isRollingDice: false,
        diceResult: data.result 
      });
      
      // Iniciar animación de movimiento paso a paso
      const { gameState, animateMovement } = get();
      if (gameState) {
        const player = gameState.players.find(p => p.player_id === data.player_id);
        if (player) {
          animateMovement(data.player_id, player.position, data.result);
        }
      }
      
      // Limpiar resultado después de mostrar
      setTimeout(() => {
        set({ diceResult: null });
      }, 3000);
    });

    // Jugador movido
    socket.on('mario:player_moved', (data: any) => {
      console.log('🏃 Jugador movido:', data);
      
      const { gameState, animatedPositions } = get();
      if (gameState) {
        // Actualizar posición del jugador
        const updatedPlayers = gameState.players.map(p => 
          p.player_id === data.player_id 
            ? { ...p, position: data.new_position }
            : p
        );
        
        // Actualizar posición animada también
        const updatedAnimatedPositions = {
          ...animatedPositions,
          [data.player_id]: data.new_position
        };
        
        set({
          gameState: {
            ...gameState,
            players: updatedPlayers
          },
          animatedPositions: updatedAnimatedPositions
        });
      }
    });

    // Evento de casilla
    socket.on('mario:casilla_event', (data: any) => {
      console.log('📍 Evento de casilla:', data);
      set({ 
        currentEvent: data.evento,
        showCasillaEvent: true 
      });
    });

    // Cambio de turno
    socket.on('mario:turn_changed', (data: { currentPlayer: PlayerState, message: string }) => {
      console.log('🔄 Cambio de turno:', data);
      
      const { gameState } = get();
      if (gameState) {
        set({ 
          gameState: { ...gameState, current_turn: data.currentPlayer.player_id },
          currentPlayer: data.currentPlayer,
          diceResult: null
        });
        
        toast.info(data.message);
      }
    });

    // Movimiento bonus
    socket.on('mario:bonus_move', (data: any) => {
      console.log('✨ Movimiento bonus:', data);
      
      const { gameState } = get();
      if (gameState) {
        const updatedPlayers = gameState.players.map(p => 
          p.player_id === data.playerId 
            ? { ...p, position: data.to }
            : p
        );
        
        set({ 
          gameState: { ...gameState, players: updatedPlayers }
        });
        
        toast.success('¡Avanzas 2 casillas extra por responder correctamente!');
      }
    });

    // Estrella ganada
    socket.on('mario:star_won', (data: { playerId: string, message: string }) => {
      console.log('⭐ Estrella ganada:', data);
      
      const { gameState } = get();
      if (gameState) {
        const updatedPlayers = gameState.players.map(p => 
          p.player_id === data.playerId 
            ? { ...p, estrellas: p.estrellas + 1 }
            : p
        );
        
        set({ 
          gameState: { ...gameState, players: updatedPlayers }
        });
        
        toast.success(data.message, {
          duration: 5000,
          icon: '⭐'
        });
      }
    });

    // Duelo iniciado
    socket.on('mario:duel_started', (data: any) => {
      console.log('⚔️ Duelo iniciado:', data);
      toast.info(data.message);
    });

    // Duelo terminado
    socket.on('mario:duel_finished', (data: any) => {
      console.log('🏆 Duelo terminado:', data);
      
      const { gameState } = get();
      if (gameState && data.starTransferred) {
        const updatedPlayers = gameState.players.map(p => {
          if (p.player_id === data.winner.player_id) {
            return { ...p, estrellas: data.winner.estrellas };
          }
          if (p.player_id === data.loser.player_id) {
            return { ...p, estrellas: data.loser.estrellas };
          }
          return p;
        });
        
        set({ 
          gameState: { ...gameState, players: updatedPlayers }
        });
        
        toast.success(`${data.winner.nickname} ganó el duelo y robó una estrella!`);
      }
    });

    // Juego terminado
    socket.on('mario:game_finished', (data: { rankings: any[] }) => {
      console.log('🏁 Juego terminado:', data);
      // TODO: Mostrar pantalla de resultados finales
    });
  },

  cleanupSocketListeners: () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;

    socket.off('mario:game_started');
    socket.off('mario:dice_rolled');
    socket.off('mario:player_moved');
    socket.off('mario:casilla_event');
    socket.off('mario:turn_changed');
    socket.off('mario:bonus_move');
    socket.off('mario:star_won');
    socket.off('mario:duel_started');
    socket.off('mario:duel_finished');
    socket.off('mario:game_finished');
  },

  // Helpers
  isMyTurn: () => {
    const { gameState, myPlayerId } = get();
    return gameState?.current_turn === myPlayerId;
  },

  getMyPlayer: () => {
    const { gameState, myPlayerId } = get();
    return gameState?.players.find(p => p.player_id === myPlayerId) || null;
  },

  reset: () => set(initialState)
}));
