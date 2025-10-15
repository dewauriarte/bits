import apiClient from '../api';

export interface GameConfig {
  maxPlayers?: number;
  allowLateJoin?: boolean;
  showLeaderboard?: boolean;
  timePerQuestion?: number;
}

export interface CreateRoomPayload {
  quiz_id: string;
  modo_acceso?: 'abierto' | 'cerrado';
  clase_id?: string;
  config_juego?: GameConfig;
}

export interface RoomInfo {
  roomCode: string;
  quizTitle: string;
  teacherName: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  allowLateJoin: boolean;
}

export interface RoomResponse {
  room: {
    roomCode: string;
    quizId: string;
    quizTitle: string;
    teacherId: string;
    teacherName: string;
    status: string;
    players: any[];
    config: GameConfig;
    createdAt: string;
  };
  join_url: string;
}

export const roomsApi = {
  // Crear sala
  createRoom: async (payload: CreateRoomPayload) => {
    const { data } = await apiClient.post<{ success: boolean; data: RoomResponse }>('/api/rooms', payload);
    return data.data;
  },

  // Obtener info pública de sala
  getRoomInfo: async (code: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: RoomInfo }>(`/api/rooms/${code}`);
    return data.data;
  },

  // Obtener estado completo (profesor)
  getRoomFullState: async (code: string) => {
    const { data } = await apiClient.get(`/api/rooms/${code}/full`);
    return data.data;
  },

  // Iniciar juego
  startGame: async (code: string) => {
    const { data } = await apiClient.post(`/api/rooms/${code}/start`);
    return data;
  },

  // Cerrar sala
  closeRoom: async (code: string) => {
    const { data } = await apiClient.delete(`/api/rooms/${code}`);
    return data;
  },

  // Obtener salas activas del profesor
  getTeacherActiveRooms: async () => {
    const { data } = await apiClient.get('/api/rooms/teacher/active');
    return data.data;
  },
};
