import { create } from 'zustand';
import { RoomState, PlayerInfo } from '@/types/socket.types';
import gameSocket from '@/lib/socket';

interface RoomStore {
  // State
  room: RoomState | null;
  myPlayer: PlayerInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRoom: (room: RoomState | null) => void;
  setMyPlayer: (player: PlayerInfo | null) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePlayerInRoom: (playerId: string, updates: Partial<PlayerInfo>) => void;
  addPlayerToRoom: (player: PlayerInfo) => void;
  removePlayerFromRoom: (playerId: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  // Initial state
  room: null,
  myPlayer: null,
  isConnected: false,
  isLoading: false,
  error: null,

  // Actions
  setRoom: (room) => set({ room }),
  
  setMyPlayer: (player) => set({ myPlayer: player }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  updatePlayerInRoom: (playerId, updates) =>
    set((state) => {
      if (!state.room) return state;
      
      return {
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.id === playerId ? { ...p, ...updates } : p
          ),
        },
      };
    }),

  addPlayerToRoom: (player) =>
    set((state) => {
      if (!state.room) return state;
      
      // Check if player already exists
      const exists = state.room.players.some((p) => p.id === player.id);
      if (exists) return state;
      
      return {
        room: {
          ...state.room,
          players: [...state.room.players, player],
        },
      };
    }),

  removePlayerFromRoom: (playerId) =>
    set((state) => {
      if (!state.room) return state;
      
      return {
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.id !== playerId),
        },
      };
    }),

  reset: () =>
    set({
      room: null,
      myPlayer: null,
      isConnected: false,
      isLoading: false,
      error: null,
    }),
}));

// Helper functions
export const useRoomActions = () => {
  const store = useRoomStore();

  const connectToRoom = (token: string) => {
    try {
      const socket = gameSocket.connect(token);
      store.setConnected(socket.connected);
      return socket;
    } catch (error) {
      console.error('Error connecting to socket:', error);
      store.setError('Error al conectar con el servidor');
      return null;
    }
  };

  const disconnectFromRoom = () => {
    gameSocket.disconnect();
    store.setConnected(false);
  };

  return {
    connectToRoom,
    disconnectFromRoom,
  };
};
