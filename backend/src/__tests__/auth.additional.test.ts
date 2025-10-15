import request from 'supertest';
import express from 'express';
import { mockPrisma, mockRedis } from './setup';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

// Import setup to initialize mocks
import './setup';

const app = express();
app.use(express.json());

// Setup auth routes
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { refreshTokenSchema } from '../schemas/auth.schema';

const authController = new AuthController();

app.post('/api/auth/refresh', validateBody(refreshTokenSchema), (req, res) => authController.refresh(req, res));
app.post('/api/auth/logout', authenticate, (req, res) => authController.logout(req, res));
app.get('/api/auth/me', authenticate, (req, res) => authController.getMe(req, res));

describe('Auth - Additional Endpoints', () => {
  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'activo',
        nombre: 'Test',
        apellido: 'User',
        password_hash: 'hash',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const refreshToken = generateRefreshToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockRedis.get.mockResolvedValue(refreshToken);
      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when refresh token not in Redis', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        rol: 'estudiante',
      };

      const refreshToken = generateRefreshToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockRedis.get.mockResolvedValue(null); // Token not found in Redis

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'inactivo',
        nombre: 'Test',
        apellido: 'User',
        password_hash: 'hash',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const refreshToken = generateRefreshToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockRedis.get.mockResolvedValue(refreshToken);
      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when user not found', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        rol: 'estudiante',
      };

      const refreshToken = generateRefreshToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockRedis.get.mockResolvedValue(refreshToken);
      mockPrisma.usuarios.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'activo',
        nombre: 'Test',
        apellido: 'User',
        password_hash: 'hash',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const token = generateAccessToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);
      mockRedis.del.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(`refresh_token:${mockUser.id}`);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'activo',
        nombre: 'Test',
        apellido: 'User',
        password_hash: 'hash',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
        perfiles_gamer: {},
      };

      const token = generateAccessToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockPrisma.usuarios.findUnique.mockResolvedValueOnce(mockUser); // For authenticate middleware
      mockPrisma.usuarios.findUnique.mockResolvedValueOnce(mockUser); // For getMe service

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
    });

    it('should fail when user not found in getMe', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'activo',
        nombre: 'Test',
        apellido: 'User',
        password_hash: 'hash',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const token = generateAccessToken({
        userId: mockUser.id,
        username: mockUser.username,
        rol: mockUser.rol,
      });

      mockPrisma.usuarios.findUnique.mockResolvedValueOnce(mockUser); // For authenticate middleware
      mockPrisma.usuarios.findUnique.mockResolvedValueOnce(null); // For getMe service

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
