import { create } from 'zustand';
import gameSocket from '@/lib/socket';

type GameState = 'waiting' | 'countdown' | 'question' | 'feedback' | 'leaderboard' | 'finished';

interface Question {
  questionNumber: number;
  totalQuestions: number;
  questionId: string;
  texto: string;
  tipo: string;
  media_url?: string;
  opciones: Array<{
    id: string;
    texto: string;
  }>;
  timeLimit: number;
  explicacion?: string | null;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: any;
  points: number;
  breakdown: {
    basePoints: number;
    speedBonus: number;
    comboMultiplier: number;
  };
  comboStreak: number;
  newScore: number;
  newRank: number;
}

interface Player {
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  comboStreak: number;
}

interface FinalResults {
  leaderboard: Array<{
    playerId: string;
    nickname: string;
    avatar: string;
    score: number;
    rank: number;
    correctAnswers: number;
    totalAnswered: number;
    accuracy: number;
    rewards: {
      xp: number;
      coins: number;
      gems: number;
      trophies: number;
    };
  }>;
  totalQuestions: number;
}

interface GameplayStore {
  // State
  gameState: GameState;
  currentQuestion: Question | null;
  timeRemaining: number;
  myAnswer: string | string[] | Record<string, string> | null;
  answerResult: AnswerResult | null;
  leaderboard: Player[];
  finalResults: FinalResults | null;
  myScore: number;
  myCombo: number;
  roomCode: string | null;
  countdown: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  setRoomCode: (code: string) => void;
  setCurrentQuestion: (question: Question) => void;
  setTimeRemaining: (time: number) => void;
  setMyAnswer: (answer: string | string[] | Record<string, string>) => void;
  setAnswerResult: (result: AnswerResult) => void;
  setLeaderboard: (players: Player[]) => void;
  setFinalResults: (results: FinalResults) => void;
  setMyScore: (score: number) => void;
  setMyCombo: (combo: number) => void;
  setCountdown: (count: number) => void;
  resetGame: () => void;
  
  // Socket listeners
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
}

const initialState = {
  gameState: 'waiting' as GameState,
  currentQuestion: null,
  timeRemaining: 0,
  myAnswer: null,
  answerResult: null,
  leaderboard: [],
  finalResults: null,
  myScore: 0,
  myCombo: 0,
  roomCode: null,
  countdown: 0,
};

export const useGameplayStore = create<GameplayStore>((set, get) => ({
  ...initialState,

  // Actions
  setGameState: (state) => set({ gameState: state }),
  
  setRoomCode: (code) => set({ roomCode: code }),
  
  setCurrentQuestion: (question) => set({ 
    currentQuestion: question,
    timeRemaining: question.timeLimit,
    myAnswer: null,
    answerResult: null,
  }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  setMyAnswer: (answer) => set({ myAnswer: answer }),
  
  setAnswerResult: (result) => set({ 
    answerResult: result,
    myScore: result.newScore,
    myCombo: result.comboStreak,
  }),
  
  setLeaderboard: (players) => set({ leaderboard: players }),
  
  setFinalResults: (results) => set({ finalResults: results }),
  
  setMyScore: (score) => set({ myScore: score }),
  
  setMyCombo: (combo) => set({ myCombo: combo }),
  
  setCountdown: (count) => set({ countdown: count }),
  
  resetGame: () => set(initialState),

  // Socket listeners
  initializeSocketListeners: () => {
    const socket = gameSocket.getSocket();
    if (!socket) {
      console.error('Socket not available');
      return;
    }

    // game:started - Juego iniciado, comenzar countdown
    socket.on('game:started', () => {
      console.log('🎮 Game started');
      set({ gameState: 'countdown', countdown: 3 });
      
      // Countdown 3-2-1
      let count = 3;
      const interval = setInterval(() => {
        count--;
        set({ countdown: count });
        if (count <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    });

    // question:new - Nueva pregunta recibida
    socket.on('question:new', (question: Question) => {
      console.log('❓ New question:', question.questionNumber, 'Data:', question);
      set({ 
        gameState: 'question',
        currentQuestion: question,
        timeRemaining: question.timeLimit,
        myAnswer: null,
        answerResult: null,
      });
      console.log('✅ State updated to question');
    });

    // timer:tick - Actualización del timer
    socket.on('timer:tick', (data: { timeRemaining: number }) => {
      set({ timeRemaining: data.timeRemaining });
    });

    // question:timeout - Tiempo agotado
    socket.on('question:timeout', () => {
      console.log('⏰ Question timeout');
      const { myAnswer, myScore } = get();
      
      // Si no respondió, marcar como incorrecto
      if (!myAnswer) {
        set({
          answerResult: {
            isCorrect: false,
            correctAnswer: null,
            points: 0,
            breakdown: { basePoints: 0, speedBonus: 0, comboMultiplier: 1 },
            comboStreak: 0,
            newScore: myScore,
            newRank: 0,
          },
          gameState: 'feedback',
        });
      }
    });

    // question:waiting - Esperar antes de siguiente pregunta
    socket.on('question:waiting', () => {
      console.log('⏳ Waiting for next question');
      set({ gameState: 'waiting' });
    });

    // question:results - Resultados de la pregunta
    socket.on('question:results', (data: any) => {
      console.log('📊 Question results:', data);
      
      // Actualizar leaderboard con los datos recibidos
      if (data.leaderboard) {
        set({ leaderboard: data.leaderboard });
      }
      
      // Cambiar a leaderboard después del feedback (reducido a 4 segundos)
      setTimeout(() => {
        set({ gameState: 'leaderboard' });
      }, 4000);
    });

    // leaderboard:update - Actualización del leaderboard
    socket.on('leaderboard:update', (data: { leaderboard: Player[] }) => {
      console.log('🏆 Leaderboard update');
      set({ leaderboard: data.leaderboard });
    });

    // game:finished - Juego terminado
    socket.on('game:finished', (data: FinalResults) => {
      console.log('🏁 Game finished');
      set({ 
        gameState: 'finished',
        finalResults: data,
      });
    });

    // game:closed - Juego cerrado por el profesor
    socket.on('game:closed', (data: any) => {
      console.log('❌ Game closed by teacher');
      const message = data?.message || 'El profesor ha cerrado la sala';
      
      // Import dinámico para evitar problemas circulares
      import('sonner').then(({ toast }) => {
        toast.warning(message, { duration: 5000 });
      });
      
      // Navegar a student join después de 2 segundos
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/student/join';
        }
      }, 2000);
    });

    // error - Manejo de errores
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });

    console.log('✅ Socket listeners initialized');
  },

  cleanupSocketListeners: () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;

    socket.off('game:started');
    socket.off('question:new');
    socket.off('timer:tick');
    socket.off('question:timeout');
    socket.off('question:waiting');
    socket.off('question:results');
    socket.off('leaderboard:update');
    socket.off('game:finished');
    socket.off('game:closed');
    socket.off('error');
    
    console.log('🧹 Socket listeners cleaned up');
  },
}));
