import { io, Socket } from 'socket.io-client';
import { JoinRoomPayload, PlayerReadyPayload, StartGamePayload, SocketResponse } from '@/types/socket.types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class GameSocket {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Game events
  joinRoom(payload: JoinRoomPayload, callback: (response: SocketResponse) => void): void {
    if (!this.socket) {
      callback({ success: false, message: 'Socket not connected' });
      return;
    }
    this.socket.emit('game:join', payload, callback);
  }

  leaveRoom(callback?: (response: SocketResponse) => void): void {
    if (!this.socket) return;
    this.socket.emit('game:leave', callback);
  }

  toggleReady(payload: PlayerReadyPayload, callback?: (response: SocketResponse) => void): void {
    if (!this.socket) return;
    this.socket.emit('game:ready', payload, callback);
  }

  startGame(payload: StartGamePayload, callback?: (response: SocketResponse) => void): void {
    if (!this.socket) return;
    this.socket.emit('game:start', payload, callback);
  }

  closeRoom(payload: { roomCode: string }, callback?: (response: SocketResponse) => void): void {
    if (!this.socket) return;
    this.socket.emit('game:close', payload, callback);
  }

  // Event listeners
  onPlayerJoined(callback: (data: any) => void): void {
    this.socket?.on('player:joined', callback);
  }

  onPlayerLeft(callback: (data: any) => void): void {
    this.socket?.on('player:left', callback);
  }

  onPlayerDisconnected(callback: (data: any) => void): void {
    this.socket?.on('player:disconnected', callback);
  }

  onPlayerReady(callback: (data: any) => void): void {
    this.socket?.on('player:ready', callback);
  }

  onRoomUpdated(callback: (data: any) => void): void {
    this.socket?.on('room:updated', callback);
  }

  onGameStarting(callback: (data: any) => void): void {
    this.socket?.on('game:starting', callback);
  }

  onGameCountdown(callback: (data: any) => void): void {
    this.socket?.on('game:countdown', callback);
  }

  onGameStarted(callback: (data: any) => void): void {
    this.socket?.on('game:started', callback);
  }

  onGameCancelled(callback: (data: any) => void): void {
    this.socket?.on('game:cancelled', callback);
  }

  onGamePaused(callback: (data: any) => void): void {
    this.socket?.on('game:paused', callback);
  }

  onGameClosed(callback: (data: any) => void): void {
    this.socket?.on('game:closed', callback);
  }

  // Remove listeners
  offPlayerJoined(callback?: (data: any) => void): void {
    this.socket?.off('player:joined', callback);
  }

  offPlayerLeft(callback?: (data: any) => void): void {
    this.socket?.off('player:left', callback);
  }

  offPlayerDisconnected(callback?: (data: any) => void): void {
    this.socket?.off('player:disconnected', callback);
  }

  offPlayerReady(callback?: (data: any) => void): void {
    this.socket?.off('player:ready', callback);
  }

  offRoomUpdated(callback?: (data: any) => void): void {
    this.socket?.off('room:updated', callback);
  }

  offGameStarting(callback?: (data: any) => void): void {
    this.socket?.off('game:starting', callback);
  }

  offGameCountdown(callback?: (data: any) => void): void {
    this.socket?.off('game:countdown', callback);
  }

  offGameStarted(callback?: (data: any) => void): void {
    this.socket?.off('game:started', callback);
  }

  offGameCancelled(callback?: (data: any) => void): void {
    this.socket?.off('game:cancelled', callback);
  }

  offGamePaused(callback?: (data: any) => void): void {
    this.socket?.off('game:paused', callback);
  }

  offGameClosed(callback?: (data: any) => void): void {
    this.socket?.off('game:closed', callback);
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// Singleton instance
export const gameSocket = new GameSocket();
export default gameSocket;
