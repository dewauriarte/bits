// Tipos para el modo Mario Party

export interface MarioPartyState {
  room_id: string;
  board_id: string;
  players: PlayerState[];
  current_turn: string; // player_id
  round: number;
  max_rounds: number;
  estrellas_posiciones: StarPosition[];
  eventos_activos: GameEvent[];
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

export interface GameEvent {
  id: string;
  tipo: string;
  descripcion: string;
  activo: boolean;
}

export interface Board {
  id: string;
  nombre: string;
  tema: string;
  total_casillas: number;
  config_casillas: Casilla[];
  imagen_preview?: string;
  posiciones_estrellas: number[];
}

export interface Casilla {
  posicion: number;
  tipo: CasillaType;
  nombre: string;
  descripcion?: string;
  color: string;
}

export enum CasillaType {
  NORMAL = 'normal',
  PREGUNTA = 'pregunta',
  ESTRELLA = 'estrella',
  DUELO = 'duelo',
  EVENTO = 'evento',
  TRAMPA = 'trampa'
}

export interface DiceRoll {
  player_id: string;
  result: number;
  timestamp: Date;
}

export interface CasillaEvent {
  tipo: CasillaType;
  jugador: string;
  descripcion: string;
  accion?: string;
  evento?: any;
}
