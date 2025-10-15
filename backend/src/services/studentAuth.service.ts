import bcrypt from 'bcrypt';
import prisma from '../config/database';
import redis from '../config/redis';
import { generateAccessToken, generateRefreshToken, JWTPayload, verifyRefreshToken } from '../utils/jwt';
import {
  JoinByCodeInput,
  JoinByQRInput,
  JoinByLinkInput,
  RegisterPermanentInput,
  LoginPermanentInput,
  LoginByAvatarInput,
} from '../schemas/studentAuth.schema';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 30; // 30 days for students
const TEMPORARY_TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours

export class StudentAuthService {
  /**
   * MÉTODO 1: Join por Código PIN
   * Estudiante ingresa código ABC123 y su nombre
   */
  async joinByCode(data: JoinByCodeInput) {
    // Buscar sala activa por código
    const sala = await prisma.salas.findFirst({
      where: { 
        codigo: data.game_code,
        estado: { not: 'finalizada' }
      },
      include: {
        quizzes: {
          select: { titulo: true, materia_id: true },
        },
      },
    });

    if (!sala) {
      throw new Error('Código de sala inválido o expirado');
    }

    // Crear participante temporal
    const participante = await prisma.participantes_temporales.create({
      data: {
        sala_id: sala.id,
        nombre: data.student_name,
        metodo_acceso: 'codigo_pin',
        activo: true,
      },
    });

    // Generar token temporal
    const payload: JWTPayload = {
      userId: participante.id,
      username: data.student_name,
      rol: 'estudiante',
      role: 'estudiante',
    };

    const accessToken = generateAccessToken(payload);

    // Guardar token temporal en Redis
    await redis.setex(
      `temp_token:${participante.id}`,
      TEMPORARY_TOKEN_EXPIRY,
      accessToken
    );

    // Registrar en historial
    await prisma.login_history.create({
      data: {
        participante_temporal_id: participante.id,
        metodo_login: 'codigo_pin',
        sala_id: sala.id,
        exitoso: true,
      },
    });

    return {
      success: true,
      token: accessToken,
      session_type: 'temporary',
      game_code: sala.codigo,
      game_name: sala.quizzes?.titulo || 'Juego',
      participant_id: participante.id,
      participant_name: data.student_name,
    };
  }

  /**
   * MÉTODO 2: Join por QR Code
   * Estudiante escanea QR que contiene token encriptado
   */
  async joinByQR(data: JoinByQRInput) {
    try {
      // Decodificar QR token (es un JWT)
      const qrPayload = verifyRefreshToken(data.qr_token);

      if (!qrPayload.gameId) {
        throw new Error('QR token inválido');
      }

      // Buscar juego
      const game = await prisma.games.findUnique({
        where: { id: qrPayload.gameId },
        include: {
          quizzes: { select: { titulo: true } },
          game_players: {
            include: {
              usuarios: { select: { id: true, nombre: true, apellido: true } },
            },
          },
        },
      });

      if (!game) {
        throw new Error('Juego no encontrado');
      }

      // Retornar lista de estudiantes para que seleccione
      const students = game.game_players.map((gp: any) => ({
        id: gp.usuarios.id,
        name: `${gp.usuarios.nombre} ${gp.usuarios.apellido}`,
      }));

      return {
        success: true,
        game_id: game.id,
        game_name: game.quizzes?.titulo || 'Juego',
        students_list: students,
        allow_new_name: true,
      };
    } catch (error) {
      throw new Error('QR code inválido o expirado');
    }
  }

  /**
   * MÉTODO 3: Join por Link Directo
   * Estudiante hace clic en tuapp.com/game/ABC123
   */
  async joinByLink(data: JoinByLinkInput) {
    // Similar a joinByCode pero con más info del juego
    const gameSession = await prisma.game_sessions.findUnique({
      where: { game_code: data.game_code },
      include: {
        games: {
          include: {
            quizzes: {
              include: {
                materias: { select: { nombre: true } },
                grados: { select: { nombre: true } },
                usuarios: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
      },
    });

    if (!gameSession || !gameSession.activo) {
      throw new Error('Link de juego inválido o expirado');
    }

    // Si student_id existe, es un estudiante registrado
    let participante;
    if (data.student_id) {
      // Verificar que el estudiante existe
      const usuario = await prisma.usuarios.findUnique({
        where: { id: data.student_id },
      });

      if (!usuario) {
        throw new Error('Estudiante no encontrado');
      }

      // Crear o actualizar player en el juego
      participante = await prisma.game_players.upsert({
        where: {
          game_id_estudiante_id: {
            game_id: gameSession.game_id,
            estudiante_id: data.student_id,
          },
        },
        create: {
          game_id: gameSession.game_id,
          estudiante_id: data.student_id,
          nickname: data.student_name,
        },
        update: {
          nickname: data.student_name,
        },
      });

      // Token permanente
      const payload: JWTPayload = {
        userId: data.student_id,
        username: usuario.username,
        rol: 'estudiante',
        role: 'estudiante',
      };

      const accessToken = generateAccessToken(payload);

      return {
        success: true,
        token: accessToken,
        session_type: 'permanent',
        game_id: gameSession.game_id,
        redirect_to: `/game/lobby/${gameSession.game_id}`,
      };
    } else {
      // Estudiante temporal
      participante = await prisma.participantes_temporales.create({
        data: {
          game_id: gameSession.game_id,
          nombre: data.student_name,
          metodo_acceso: 'link_directo',
          activo: true,
        },
      });

      const payload: JWTPayload = {
        userId: participante.id,
        username: data.student_name,
        rol: 'estudiante',
        role: 'estudiante',
      };

      const accessToken = generateAccessToken(payload);

      await redis.setex(
        `temp_token:${participante.id}`,
        TEMPORARY_TOKEN_EXPIRY,
        accessToken
      );

      return {
        success: true,
        token: accessToken,
        session_type: 'temporary',
        game_id: gameSession.game_id,
        redirect_to: `/game/lobby/${gameSession.game_id}`,
      };
    }
  }

  /**
   * MÉTODO 4: Registro Permanente (Sin Email)
   * Estudiante se registra con username.formato sin email
   */
  async registerPermanent(data: RegisterPermanentInput) {
    // Verificar username único
    const existingUser = await prisma.usuarios.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error('Username ya está en uso. Intenta otro.');
    }

    // Hash password simple
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Crear usuario y perfil gamer
    const usuario = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.usuarios.create({
        data: {
          username: data.username,
          email: data.email || null, // Opcional
          password_hash: passwordHash,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: 'estudiante',
          tipo_auth: 'username',
          fecha_nacimiento: new Date(new Date().setFullYear(new Date().getFullYear() - data.age)),
          estado: 'activo',
        },
      });

      // Crear perfil gamer
      await tx.perfiles_gamer.create({
        data: {
          usuario_id: newUser.id,
          nivel: 1,
          experiencia: 0,
          puntos_totales: 0,
          copas: 0,
          trofeos_oro: 0,
          trofeos_plata: 0,
          trofeos_bronce: 0,
        },
      });

      return newUser;
    });

    // Generar tokens
    const payload: JWTPayload = {
      userId: usuario.id,
      username: usuario.username,
      rol: 'estudiante',
      role: 'estudiante',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redis.setex(
      `refresh_token:${usuario.id}`,
      REFRESH_TOKEN_EXPIRY,
      refreshToken
    );

    // Registrar en historial
    await prisma.login_history.create({
      data: {
        usuario_id: usuario.id,
        metodo_login: 'username_password',
        exitoso: true,
      },
    });

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
      accessToken,
      refreshToken,
      session_type: 'permanent',
    };
  }

  /**
   * MÉTODO 4: Login Permanente
   * Estudiante hace login con username y password
   */
  async loginPermanent(data: LoginPermanentInput) {
    // Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { username: data.username },
      include: {
        perfiles_gamer: true,
      },
    });

    if (!usuario || usuario.rol !== 'estudiante') {
      throw new Error('Usuario no encontrado');
    }

    if (usuario.estado !== 'activo') {
      throw new Error('Cuenta inactiva');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(data.password, usuario.password_hash);

    if (!isPasswordValid) {
      throw new Error('Password incorrecto');
    }

    // Actualizar último login
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { ultimo_login: new Date() },
    });

    // Generar tokens
    const payload: JWTPayload = {
      userId: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      role: usuario.rol,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redis.setex(
      `refresh_token:${usuario.id}`,
      REFRESH_TOKEN_EXPIRY,
      refreshToken
    );

    // Registrar en historial
    await prisma.login_history.create({
      data: {
        usuario_id: usuario.id,
        metodo_login: 'username_password',
        exitoso: true,
      },
    });

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        avatarUrl: usuario.avatar_url,
      },
      perfil_gamer: usuario.perfiles_gamer ? {
        ...usuario.perfiles_gamer,
        puntos_totales: Number(usuario.perfiles_gamer.puntos_totales),
      } : null,
      accessToken,
      refreshToken,
      session_type: 'permanent',
    };
  }

  /**
   * MÉTODO 5: Login por Avatar (Niños 3-6 años)
   * Niño toca su avatar asignado
   */
  async loginByAvatar(data: LoginByAvatarInput) {
    // Buscar avatar asignado
    const avatar = await prisma.avatares_clase.findUnique({
      where: { id: data.avatar_id },
      include: {
        usuarios: {
          include: {
            perfiles_gamer: true,
          },
        },
      },
    });

    if (!avatar || avatar.clase_id !== data.class_id) {
      throw new Error('Avatar no encontrado en esta clase');
    }

    if (!avatar.asignado || !avatar.estudiante_id) {
      throw new Error('Este avatar no está asignado a ningún estudiante');
    }

    if (!avatar.activo) {
      throw new Error('Avatar inactivo');
    }

    const usuario = avatar.usuarios;

    if (!usuario || usuario.estado !== 'activo') {
      throw new Error('Estudiante no encontrado o inactivo');
    }

    // Actualizar último login
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { ultimo_login: new Date() },
    });

    // Generar token
    const payload: JWTPayload = {
      userId: usuario.id,
      username: usuario.username,
      rol: 'estudiante',
      role: 'estudiante',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redis.setex(
      `refresh_token:${usuario.id}`,
      REFRESH_TOKEN_EXPIRY,
      refreshToken
    );

    // Registrar en historial
    await prisma.login_history.create({
      data: {
        usuario_id: usuario.id,
        clase_id: data.class_id,
        metodo_login: 'avatar',
        exitoso: true,
      },
    });

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        avatar_emoji: avatar.emoji,
        avatar_nombre: avatar.nombre_avatar,
        rol: usuario.rol,
      },
      perfil_gamer: usuario.perfiles_gamer ? {
        ...usuario.perfiles_gamer,
        puntos_totales: Number(usuario.perfiles_gamer.puntos_totales),
      } : null,
      accessToken,
      refreshToken,
      session_type: 'permanent',
    };
  }

  /**
   * Obtener avatares de una clase
   */
  async getClassAvatars(classId: string) {
    // Validar que classId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!classId || !uuidRegex.test(classId)) {
      throw new Error('ID de clase inválido');
    }

    const clase = await prisma.clases.findUnique({
      where: { id: classId },
      include: {
        avatares_clase: {
          include: {
            usuarios: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
          orderBy: { posicion: 'asc' },
        },
      },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    return {
      class_name: clase.nombre,
      avatars: clase.avatares_clase.map((avatar: any) => ({
        id: avatar.id,
        emoji: avatar.emoji,
        color: avatar.color,
        nombre_avatar: avatar.nombre_avatar,
        estudiante_nombre: avatar.usuarios
          ? `${avatar.usuarios.nombre} ${avatar.usuarios.apellido}`
          : null,
        estudiante_id: avatar.estudiante_id,
        asignado: avatar.asignado,
        posicion: avatar.posicion,
      })),
    };
  }

  /**
   * Asignar avatar a estudiante (Profesor)
   */
  async assignAvatar(classId: string, avatarId: string, estudianteId: string) {
    // Verificar que el avatar existe y pertenece a la clase
    const avatar = await prisma.avatares_clase.findUnique({
      where: { id: avatarId },
    });

    if (!avatar || avatar.clase_id !== classId) {
      throw new Error('Avatar no encontrado en esta clase');
    }

    if (avatar.asignado && avatar.estudiante_id !== estudianteId) {
      throw new Error('Avatar ya está asignado a otro estudiante');
    }

    // Verificar que el estudiante existe
    const estudiante = await prisma.usuarios.findUnique({
      where: { id: estudianteId },
    });

    if (!estudiante || estudiante.rol !== 'estudiante') {
      throw new Error('Estudiante no encontrado');
    }

    // Actualizar tipo de auth del estudiante a avatar
    await prisma.usuarios.update({
      where: { id: estudianteId },
      data: { tipo_auth: 'avatar' },
    });

    // Asignar avatar
    const avatarAsignado = await prisma.avatares_clase.update({
      where: { id: avatarId },
      data: {
        estudiante_id: estudianteId,
        asignado: true,
        fecha_asignacion: new Date(),
      },
    });

    return {
      success: true,
      message: `Avatar ${avatarAsignado.emoji} ${avatarAsignado.nombre_avatar} asignado a ${estudiante.nombre} ${estudiante.apellido}`,
      avatar: {
        id: avatarAsignado.id,
        emoji: avatarAsignado.emoji,
        nombre: avatarAsignado.nombre_avatar,
      },
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
      },
    };
  }

  /**
   * Obtener información del juego por código
   */
  async getGameInfo(gameCode: string) {
    const gameSession = await prisma.game_sessions.findUnique({
      where: { game_code: gameCode.toUpperCase() },
      include: {
        games: {
          include: {
            quizzes: {
              include: {
                materias: { select: { nombre: true } },
                grados: { select: { nombre: true } },
                usuarios: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
      },
    });

    if (!gameSession || !gameSession.activo) {
      throw new Error('Juego no encontrado');
    }

    const quiz = gameSession.games.quizzes;

    return {
      game_id: gameSession.game_id,
      game_name: quiz?.titulo || 'Juego',
      teacher_name: quiz?.usuarios
        ? `${quiz.usuarios.nombre} ${quiz.usuarios.apellido}`
        : 'Profesor',
      subject: quiz?.materias?.nombre || '',
      grade: quiz?.grados?.nombre || '',
      status: gameSession.games.estado,
      allow_new_students: gameSession.permite_invitados,
    };
  }
}
