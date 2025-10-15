import { Server as SocketIOServer } from 'socket.io';
import prisma from '../config/database';
import redis from '../config/redis';
import { RoomState, PlayerInfo, GameConfig } from '../types/socket.types';

class RoomManager {
  private io: SocketIOServer | null = null;
  private rooms: Map<string, RoomState> = new Map();

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Generar código único de sala (6-8 caracteres)
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crear una nueva sala de juego
   */
  async createRoom(
    quizId: string,
    teacherId: string,
    config: GameConfig = {},
    modoAcceso: 'abierto' | 'cerrado' = 'abierto',
    claseId?: string
  ): Promise<RoomState> {
    // Buscar información del quiz y profesor
    const quiz = await prisma.quizzes.findUnique({
      where: { id: quizId },
      select: { id: true, titulo: true },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    const teacher = await prisma.usuarios.findUnique({
      where: { id: teacherId },
      select: { id: true, nombre: true, apellido: true },
    });

    if (!teacher) {
      throw new Error('Profesor no encontrado');
    }

    // Generar código único
    let roomCode = this.generateRoomCode();
    let exists = await prisma.salas.findUnique({ where: { codigo: roomCode } });
    
    while (exists) {
      roomCode = this.generateRoomCode();
      exists = await prisma.salas.findUnique({ where: { codigo: roomCode } });
    }

    // Crear sala en BD
    const sala = await prisma.salas.create({
      data: {
        codigo: roomCode,
        quiz_id: quizId,
        profesor_id: teacherId,
        clase_id: claseId,
        tipo_sala: 'kahoot',
        modo_acceso: modoAcceso,
        estado: 'esperando', // lobby
        config_juego: config as any,
        max_participantes: config.maxPlayers || 50,
      },
    });

    // Crear estado en memoria
    const roomState: RoomState = {
      roomCode,
      quizId,
      quizTitle: quiz.titulo,
      teacherId,
      teacherName: `${teacher.nombre} ${teacher.apellido}`,
      status: 'lobby',
      players: [],
      config: {
        maxPlayers: config.maxPlayers || 50,
        allowLateJoin: config.allowLateJoin ?? true,
        showLeaderboard: config.showLeaderboard ?? true,
        timePerQuestion: config.timePerQuestion || 20,
      },
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, roomState);

    // Guardar en Redis (backup)
    await redis.set(`room:${roomCode}`, JSON.stringify(roomState), 'EX', 3600 * 4); // 4 horas

    // Si es modo cerrado, pre-cargar estudiantes de la clase
    if (modoAcceso === 'cerrado' && claseId) {
      await this.preloadClassStudents(sala.id, claseId, roomState);
    }

    console.log(`✅ Room created: ${roomCode} for quiz ${quiz.titulo} (Modo: ${modoAcceso})`);
    return roomState;
  }

  /**
   * Pre-cargar estudiantes de una clase en la sala (modo privado)
   */
  private async preloadClassStudents(salaId: string, claseId: string, roomState: RoomState): Promise<void> {
    // Obtener estudiantes de la clase (excluir profesores)
    const claseEstudiantes = await prisma.clase_estudiantes.findMany({
      where: { clase_id: claseId },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatar_url: true,
            rol: true,
          },
        },
      },
    });

    // Crear participantes pre-cargados en BD (estado: desconectado)
    for (const estudiante of claseEstudiantes) {
      const usuario = estudiante.usuarios;
      if (!usuario) continue; // Skip si no tiene usuario asociado
      if (usuario.rol !== 'estudiante') continue; // Solo estudiantes, no profesores

      const participante = await prisma.sala_participantes.create({
        data: {
          sala_id: salaId,
          usuario_id: usuario.id,
          nickname: `${usuario.nombre} ${usuario.apellido}`,
          avatar: usuario.avatar_url || '👤',
          estado: 'desconectado', // No conectado aún
        },
      });

      // Agregar a memoria como desconectado
      const player: PlayerInfo = {
        id: participante.id,
        userId: usuario.id,
        nickname: `${usuario.nombre} ${usuario.apellido}`,
        avatar: usuario.avatar_url || '👤',
        isReady: false,
        isConnected: false, // No conectado
        joinedAt: new Date(),
      };

      roomState.players.push(player);
    }

    // Actualizar en memoria y Redis
    this.rooms.set(roomState.roomCode, roomState);
    await redis.set(`room:${roomState.roomCode}`, JSON.stringify(roomState), 'EX', 3600 * 4);
    
    console.log(`✅ Pre-loaded ${claseEstudiantes.length} students for room ${roomState.roomCode}`);
  }

  /**
   * Obtener estado de una sala
   */
  async getRoomState(roomCode: string): Promise<RoomState | null> {
    // Intentar desde memoria primero
    let room = this.rooms.get(roomCode);

    if (!room) {
      // Buscar en Redis
      const cached = await redis.get(`room:${roomCode}`);
      if (cached) {
        room = JSON.parse(cached);
        this.rooms.set(roomCode, room!);
      }
    }

    if (!room) {
      // Buscar en BD como último recurso
      const sala = await prisma.salas.findUnique({
        where: { codigo: roomCode },
        include: {
          quizzes: { select: { titulo: true } },
          usuarios: { select: { nombre: true, apellido: true } },
          sala_participantes: {
            select: {
              id: true,
              usuario_id: true,
              nickname: true,
              avatar: true,
              estado: true,
              fecha_union: true,
            },
          },
        },
      });

      if (!sala) return null;

      // Reconstruir estado
      room = {
        roomCode: sala.codigo,
        quizId: sala.quiz_id!,
        quizTitle: sala.quizzes?.titulo || 'Quiz',
        teacherId: sala.profesor_id!,
        teacherName: `${sala.usuarios?.nombre} ${sala.usuarios?.apellido}`,
        status: this.mapSalaEstadoToRoomStatus(sala.estado),
        players: sala.sala_participantes.map((p) => ({
          id: p.id,
          userId: p.usuario_id || undefined,
          nickname: p.nickname || 'Anónimo',
          avatar: p.avatar || '👤',
          isReady: p.estado === 'listo',
          isConnected: p.estado === 'conectado' || p.estado === 'listo',
          joinedAt: p.fecha_union || new Date(),
        })),
        config: (sala.config_juego as GameConfig) || {},
        createdAt: sala.fecha_creacion || new Date(),
      };

      this.rooms.set(roomCode, room);
    }

    return room;
  }

  /**
   * Agregar jugador a la sala
   */
  async joinRoom(
    roomCode: string,
    userId: string | null,
    nickname: string,
    avatar: string,
    participantId?: string
  ): Promise<{ player: PlayerInfo; isReconnect: boolean }> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      throw new Error('Sala no encontrada');
    }


    // Si viene participantId, es un estudiante pre-cargado que se está conectando
    if (participantId) {
      const preloadedPlayer = room.players.find(p => p.id === participantId);
      if (preloadedPlayer) {
        // Actualizar estudiante pre-cargado con avatar personalizado
        preloadedPlayer.isConnected = true;
        preloadedPlayer.avatar = avatar; // Actualizar avatar personalizado
        this.rooms.set(roomCode, room);
        await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);
        
        // Actualizar estado y avatar en BD
        await prisma.sala_participantes.update({
          where: { id: participantId },
          data: { 
            estado: 'conectado',
            avatar: avatar, // Guardar avatar personalizado
          },
        });
        
        return { player: preloadedPlayer, isReconnect: false }; // No es reconexión, es primera conexión
      }
    }

    // Buscar sala en BD primero (necesaria para verificaciones posteriores)
    const sala = await prisma.salas.findUnique({
      where: { codigo: roomCode },
    });

    if (!sala) {
      throw new Error('Sala no encontrada en BD');
    }

    // Validar userId: si es token temporal, usar null
    const validUserId = userId && !userId.startsWith('temp_') ? userId : null;

    // Verificar si el jugador ya existe por nickname (reconexión o duplicado)
    const existingPlayer = room.players.find(
      (p) => p.nickname.toLowerCase().trim() === nickname.toLowerCase().trim()
    );

    if (existingPlayer) {
      // Es una reconexión - actualizar estado
      existingPlayer.isConnected = true;
      this.rooms.set(roomCode, room);
      await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);
      console.log(`✅ Player ${nickname} reconnected to room ${roomCode} (prevented duplicate)`);
      return { player: existingPlayer, isReconnect: true };
    }

    // Verificar TAMBIÉN en BD antes de crear nuevo registro
    const existingInDBByNickname = await prisma.sala_participantes.findFirst({
      where: {
        sala_id: sala.id,
        nickname: nickname.trim(),
      },
    });

    if (existingInDBByNickname) {
      // Ya existe en BD, usar ese registro y agregarlo a memoria
      const player: PlayerInfo = {
        id: existingInDBByNickname.id,
        userId: validUserId || undefined,
        nickname: nickname.trim(),
        avatar: avatar || '👤',
        isReady: false,
        isConnected: true,
        joinedAt: new Date(),
      };
      room.players.push(player);
      this.rooms.set(roomCode, room);
      await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);
      console.log(`✅ Player ${nickname} loaded from DB (prevented duplicate insertion)`);
      return { player, isReconnect: true };
    }

    // Nuevo jugador - solo permitir en lobby o si allowLateJoin está activado
    if (room.status !== 'lobby' && !room.config.allowLateJoin) {
      console.log(`❌ Join rejected - Room not in lobby, current players:`, room.players.map(p => p.nickname));
      throw new Error('La sala ya ha iniciado y no permite unirse tarde');
    }

    // Verificar límite de jugadores
    if (room.config.maxPlayers && room.players.length >= room.config.maxPlayers) {
      throw new Error('La sala está llena');
    }

    // Crear nuevo participante en BD (ya verificamos que no existe)
    const participante = await prisma.sala_participantes.create({
        data: {
          sala_id: sala.id,
          usuario_id: validUserId,
          nickname: nickname.trim(),
          avatar: avatar || '👤',
          estado: 'conectado',
        },
      });
      console.log(`✅ Player ${nickname} created in room ${roomCode}`);

    // Agregar a memoria solo si no existe
    const existingInMemory = room.players.find(p => p.id === participante.id);
    let player: PlayerInfo;
    
    if (existingInMemory) {
      existingInMemory.isConnected = true;
      player = existingInMemory;
    } else {
      player = {
        id: participante.id,
        userId: validUserId || undefined,
        nickname: nickname.trim(),
        avatar: avatar || '👤',
        isReady: false,
        isConnected: true,
        joinedAt: new Date(),
      };
      room.players.push(player);
    }

    this.rooms.set(roomCode, room);

    // Actualizar Redis
    await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);

    return { player, isReconnect: false };
  }

  /**
   * Marcar jugador como listo/no listo
   */
  async togglePlayerReady(roomCode: string, playerId: string): Promise<boolean> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    const player = room.players.find((p) => p.id === playerId);

    if (!player) {
      throw new Error('Jugador no encontrado');
    }

    player.isReady = !player.isReady;

    // Actualizar BD
    await prisma.sala_participantes.update({
      where: { id: playerId },
      data: { estado: player.isReady ? 'listo' : 'conectado' },
    });

    // Actualizar memoria y Redis
    this.rooms.set(roomCode, room);
    await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);

    return player.isReady;
  }

  /**
   * Remover jugador de la sala
   */
  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      return;
    }

    // Actualizar estado en BD
    await prisma.sala_participantes.update({
      where: { id: playerId },
      data: { estado: 'desconectado' },
    });

    // Remover de memoria
    room.players = room.players.filter((p) => p.id !== playerId);
    this.rooms.set(roomCode, room);

    // Actualizar Redis
    await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);

    console.log(`✅ Player ${playerId} left room ${roomCode}`);
  }

  /**
   * Iniciar el juego
   */
  async startGame(roomCode: string, teacherId: string): Promise<void> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.teacherId !== teacherId) {
      throw new Error('Solo el profesor puede iniciar el juego');
    }

    if (room.players.length < 1) {
      throw new Error('Se necesita al menos 1 jugador para iniciar');
    }

    // Actualizar estado
    room.status = 'starting';
    room.startedAt = new Date();

    // Actualizar BD
    await prisma.salas.update({
      where: { codigo: roomCode },
      data: {
        estado: 'en_curso',
        fecha_inicio: new Date(),
      },
    });

    this.rooms.set(roomCode, room);
    await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);

    console.log(`✅ Game starting in room ${roomCode}`);
  }

  /**
   * Cambiar estado del juego a activo
   */
  async activateGame(roomCode: string): Promise<void> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    room.status = 'active';

    await prisma.salas.update({
      where: { codigo: roomCode },
      data: { estado: 'en_curso' },
    });

    this.rooms.set(roomCode, room);
    await redis.set(`room:${roomCode}`, JSON.stringify(room), 'EX', 3600 * 4);

    console.log(`✅ Game activated in room ${roomCode}`);
  }

  /**
   * Cerrar sala
   */
  async closeRoom(roomCode: string, teacherId: string): Promise<void> {
    const room = await this.getRoomState(roomCode);

    if (!room) {
      return;
    }

    if (room.teacherId !== teacherId) {
      throw new Error('Solo el profesor puede cerrar la sala');
    }

    // Actualizar BD
    await prisma.salas.update({
      where: { codigo: roomCode },
      data: {
        estado: 'finalizado',
        fecha_fin: new Date(),
      },
    });

    // Desconectar todos los sockets
    if (this.io) {
      this.io.to(`game:${roomCode}`).emit('game:closed', {
        message: 'La sala ha sido cerrada por el profesor',
      });
      
      // Hacer que todos los sockets salgan de la room
      const sockets = await this.io.in(`game:${roomCode}`).fetchSockets();
      for (const socket of sockets) {
        socket.leave(`game:${roomCode}`);
      }
    }

    // Limpiar de memoria y Redis
    this.rooms.delete(roomCode);
    await redis.del(`room:${roomCode}`);

    console.log(`✅ Room ${roomCode} closed`);
  }

  /**
   * Broadcast a todos en la sala
   */
  broadcastToRoom(roomCode: string, event: string, data: any): void {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    this.io.to(`game:${roomCode}`).emit(event, data);
  }

  /**
   * Mapear estado de BD a estado de room
   */
  private mapSalaEstadoToRoomStatus(estado: string | null): 'lobby' | 'starting' | 'active' | 'paused' | 'finished' {
    switch (estado) {
      case 'esperando':
        return 'lobby';
      case 'en_curso':
        return 'active';
      case 'pausado':
        return 'paused';
      case 'finalizado':
        return 'finished';
      default:
        return 'lobby';
    }
  }
}

export default new RoomManager();
