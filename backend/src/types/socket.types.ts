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
