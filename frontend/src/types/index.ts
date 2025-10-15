export type UserRole = 'admin' | 'profesor' | 'estudiante';

export interface PerfilGamer {
  puntos_totales: number;
  nivel: number;
  experiencia: number;
  racha_actual: number;
  racha_maxima: number;
  avatar_url: string | null;
  titulo_actual: string | null;
  monedas: number;
}

export interface User {
  id_usuario: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  fecha_nacimiento: string | null;
  es_menor: boolean;
  estado: string;
  created_at: string;
  perfil_gamer?: PerfilGamer;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  fechaNacimiento?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface ApiError {
  message: string;
  status: number;
}
