import { apiClient } from './api';
import type { 
  AuthResponse, 
  LoginResponse, 
  RegisterInput, 
  LoginInput,
  User 
} from '@/types';

export const authApi = {
  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Inicia sesión con email/username y password
   */
  async login(credentials: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Cierra sesión del usuario actual
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post('/api/auth/logout', { refreshToken });
    
    // Limpiar tokens del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    return response.data;
  },

  /**
   * Obtiene la información del usuario actual
   */
  async getMe(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ 
    success: boolean; 
    data: { accessToken: string; refreshToken: string } 
  }> {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authApi;
