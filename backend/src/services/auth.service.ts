import bcrypt from 'bcrypt';
import prisma from '../config/database';
import redis from '../config/redis';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

export class AuthService {
  async register(data: RegisterInput) {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email || undefined }],
      },
    });

    if (existingUser) {
      throw new Error('Username o email ya está en uso');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Crear usuario y perfil gamer en transacción
    const usuario = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.usuarios.create({
        data: {
          username: data.username,
          email: data.email || null,
          password_hash: passwordHash,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: data.rol,
          fecha_nacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
          estado: 'activo',
          tipo_auth: data.rol === 'estudiante' ? 'username' : 'email',
        },
      });

      // Crear perfil gamer si es estudiante
      if (data.rol === 'estudiante') {
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
      }

      return newUser;
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

    // Guardar refresh token en Redis
    await redis.setex(`refresh_token:${usuario.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        avatarUrl: usuario.avatar_url,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput) {
    console.log('🔐 Intentando login:', data.username);
    
    // Buscar usuario por username o email
    const usuario = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.username },
        ],
      },
      include: {
        perfiles_gamer: true,
      },
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado:', data.username);
      throw new Error('Credenciales inválidas');
    }

    console.log('✅ Usuario encontrado:', usuario.username, '| Estado:', usuario.estado);

    // Verificar estado
    if (usuario.estado !== 'activo') {
      console.log('❌ Cuenta no activa:', usuario.estado);
      throw new Error('Cuenta inactiva o suspendida');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(data.password, usuario.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Password inválido');
      throw new Error('Credenciales inválidas');
    }

    console.log('✅ Password correcto');

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

    // Guardar refresh token en Redis
    await redis.setex(`refresh_token:${usuario.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        avatarUrl: usuario.avatar_url,
        perfilGamer: usuario.perfiles_gamer ? {
          ...usuario.perfiles_gamer,
          puntos_totales: Number(usuario.perfiles_gamer.puntos_totales || 0),
        } : null,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(oldRefreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/jwt');

    // Verificar el token
    let payload: JWTPayload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new Error('Refresh token inválido o expirado');
    }

    // Verificar que el token exista en Redis
    const storedToken = await redis.get(`refresh_token:${payload.userId}`);

    if (storedToken !== oldRefreshToken) {
      throw new Error('Refresh token inválido');
    }

    // Verificar que el usuario siga existiendo y activo
    const usuario = await prisma.usuarios.findUnique({
      where: { id: payload.userId },
    });

    if (!usuario || usuario.estado !== 'activo') {
      throw new Error('Usuario no encontrado o inactivo');
    }

    // Generar nuevo access token
    const newPayload: JWTPayload = {
      userId: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      role: usuario.rol,
    };

    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  }

  async logout(userId: string) {
    // Eliminar refresh token de Redis
    await redis.del(`refresh_token:${userId}`);
    return { message: 'Logout exitoso' };
  }

  async getMe(userId: string) {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
      include: {
        perfiles_gamer: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      avatarUrl: usuario.avatar_url,
      fechaNacimiento: usuario.fecha_nacimiento,
      estado: usuario.estado,
      perfilGamer: usuario.perfiles_gamer ? {
        ...usuario.perfiles_gamer,
        puntos_totales: Number(usuario.perfiles_gamer.puntos_totales || 0),
      } : null,
    };
  }
}
