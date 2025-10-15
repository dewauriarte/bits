import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginInput, RegisterInput } from '@/types';
import authApi from '@/lib/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokenAction: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false, // Se calculará dinámicamente
      role: null,
      isLoading: false,
      error: null,

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          role: user.rol,
          error: null,
        });
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          error: null,
        });
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authApi.login(credentials);
          
          const { user, accessToken, refreshToken } = response.data;
          get().setAuth(user, accessToken, refreshToken);
          
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Error al iniciar sesión';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authApi.register(data);
          
          const { user, accessToken, refreshToken } = response.data;
          get().setAuth(user, accessToken, refreshToken);
          
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Error al registrarse';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authApi.logout();
          get().clearAuth();
          set({ isLoading: false });
        } catch (error: any) {
          get().clearAuth();
          set({ isLoading: false });
          throw error;
        }
      },

      refreshTokenAction: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(currentRefreshToken);
          const { accessToken, refreshToken } = response.data;
          
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ token: accessToken, refreshToken });
        } catch (error) {
          get().clearAuth();
          throw error;
        }
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await authApi.getMe();
          
          const token = get().token;
          const refreshToken = get().refreshToken;
          
          if (token && refreshToken) {
            get().setAuth(response.data.user, token, refreshToken);
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Error al obtener usuario';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
