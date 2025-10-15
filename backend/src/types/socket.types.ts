import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export interface RoomState {
  roomCode: string;
  quizId: string;
  quizTitle: string;
  teacherId: string;
  teacherName: string;
  status: 'lobby' | 'starting' | 'active' | 'paused' | 'finished';
  players: PlayerInfo[];
  config: GameConfig;
  createdAt: Date;
  startedAt?: Date;
}

export interface PlayerInfo {
  id: string;
  userId?: string;
  nickname: string;
  avatar: string;
  isReady: boolean;
  isConnected: boolean;
  joinedAt: Date;
}

export interface GameConfig {
  maxPlayers?: number;
  allowLateJoin?: boolean;
  showLeaderboard?: boolean;
  timePerQuestion?: number;
}

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  avatar?: string;
  participantId?: string; // ID de participante pre-cargado (salas privadas)
}

export interface PlayerReadyPayload {
  roomCode: string;
  isReady: boolean;
}

export interface StartGamePayload {
  roomCode: string;
}

export interface CountdownEvent {
  count: number;
  message: string;
}

// ========== Gameplay Events ==========

export interface AnswerSubmitPayload {
  roomCode: string;
  questionId: string;
  answer: any; // string | number | array | object dependiendo del tipo de pregunta
  timeTaken: number; // tiempo en segundos
}

export interface AnswerResult {
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

export interface QuestionData {
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
}

export interface LeaderboardUpdate {
  leaderboard: Array<{
    playerId: string;
    nickname: string;
    avatar: string;
    score: number;
    rank: number;
    comboStreak: number;
  }>;
  answersCount: number;
  totalPlayers: number;
}

export interface QuestionResults {
  questionId: string;
  questionText: string;
  correctAnswer: any;
  totalResponses: number;
  correctResponses: number;
  accuracy: number;
  leaderboard: any[];
}

export interface GameFinished {
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
