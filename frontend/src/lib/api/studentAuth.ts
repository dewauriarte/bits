import apiClient from '../api';

export interface JoinByCodeData {
  game_code: string;
  student_name: string;
}

export interface JoinByQRData {
  qr_token: string;
}

export interface JoinByLinkData {
  game_code: string;
  student_name: string;
  student_id?: string;
}

export interface RegisterPermanentData {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  age: number;
  grade_id: number | string;
}

export interface LoginPermanentData {
  username: string;
  password: string;
}

export interface LoginByAvatarData {
  avatar_id: string;
  class_id: string;
}

export const studentAuthApi = {
  // MÉTODO 1: Join por Código PIN
  joinByCode: async (data: JoinByCodeData) => {
    const response = await apiClient.post('/api/auth/student/join-by-code', data);
    return response.data;
  },

  // MÉTODO 2: Join por QR Code
  joinByQR: async (data: JoinByQRData) => {
    const response = await apiClient.post('/api/auth/student/join-by-qr', data);
    return response.data;
  },

  // MÉTODO 3: Join por Link Directo - Obtener info del juego
  getGameInfo: async (gameCode: string) => {
    const response = await apiClient.get(`/api/auth/student/games/${gameCode}/info`);
    return response.data;
  },

  // MÉTODO 3: Join por Link Directo - Unirse
  joinByLink: async (data: JoinByLinkData) => {
    const response = await apiClient.post('/api/auth/student/join-by-link', data);
    return response.data;
  },

  // MÉTODO 4: Registro Permanente
  registerPermanent: async (data: RegisterPermanentData) => {
    const response = await apiClient.post('/api/auth/student/register-permanent', data);
    return response.data;
  },

  // MÉTODO 4: Login Permanente
  loginPermanent: async (data: LoginPermanentData) => {
    const response = await apiClient.post('/api/auth/student/login-permanent', data);
    return response.data;
  },

  // MÉTODO 5: Obtener avatares de una clase
  getClassAvatars: async (classId: string) => {
    const response = await apiClient.get(`/api/auth/student/classes/${classId}/avatars`);
    return response.data;
  },

  // MÉTODO 5: Login por Avatar
  loginByAvatar: async (data: LoginByAvatarData) => {
    const response = await apiClient.post('/api/auth/student/login-by-avatar', data);
    return response.data;
  },

  // PROFESOR: Asignar avatar a estudiante
  assignAvatar: async (classId: string, avatarId: string, estudianteId: string) => {
    const response = await apiClient.post(
      `/api/auth/student/classes/${classId}/avatars/${avatarId}/assign`,
      { estudiante_id: estudianteId }
    );
    return response.data;
  },
};
