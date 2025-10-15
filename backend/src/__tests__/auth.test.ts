import request from 'supertest';
import express from 'express';
import { mockPrisma, mockRedis } from './setup';
import bcrypt from 'bcrypt';

// Import setup to initialize mocks
import './setup';
import { validateBody } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const app = express();
app.use(express.json());

// Setup auth routes
import { AuthController } from '../controllers/auth.controller';
const authController = new AuthController();

app.post('/api/auth/register', validateBody(registerSchema), (req, res) => authController.register(req, res));
app.post('/api/auth/login', validateBody(loginSchema), (req, res) => authController.login(req, res));

describe('Auth - Registration', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      // Mock findFirst to return null (no existing user)
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          usuarios: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          perfiles_gamer: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      // Mock Redis
      mockRedis.setex.mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should fail with duplicate email', async () => {
      const existingUser = {
        id: 'existing-user',
        username: 'existinguser',
        email: 'test@example.com',
        rol: 'estudiante',
      };

      // Mock findFirst to return existing user
      mockPrisma.usuarios.findFirst.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'test@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya está en uso');
    });

    it('should fail with duplicate username', async () => {
      const existingUser = {
        id: 'existing-user',
        username: 'testuser',
        email: 'other@example.com',
        rol: 'estudiante',
      };

      mockPrisma.usuarios.findFirst.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'new@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya está en uso');
    });

    it('should fail with invalid password (no uppercase)', async () => {
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'test123', // No uppercase
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid password (no number)', async () => {
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestTest', // No number
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with short password', async () => {
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Te1', // Too short
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid username (special characters)', async () => {
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test@user!', // Invalid characters
          email: 'test@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with short username', async () => {
      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // Too short
          email: 'test@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(response.status).toBe(400);
    });

    it('should create perfil_gamer for estudiante role', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      mockPrisma.usuarios.findFirst.mockResolvedValue(null);

      const mockPerfilesGamerCreate = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          usuarios: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          perfiles_gamer: {
            create: mockPerfilesGamerCreate,
          },
        });
      });

      mockRedis.setex.mockResolvedValue('OK');

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123',
          nombre: 'Test',
          apellido: 'User',
          rol: 'estudiante',
        });

      expect(mockPerfilesGamerCreate).toHaveBeenCalledWith({
        data: {
          usuario_id: 'user-123',
          nivel: 1,
          experiencia: 0,
          puntos_totales: 0,
          copas: 0,
          trofeos_oro: 0,
          trofeos_plata: 0,
          trofeos_bronce: 0,
        },
      });
    });
  });
});

describe('Auth - Login', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test123', 10);
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
        perfiles_gamer: {},
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usuarios.update.mockResolvedValue(mockUser);
      mockRedis.setex.mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should fail with non-existent user', async () => {
      mockPrisma.usuarios.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Test123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('should fail with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Test123', 10);
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('should fail with inactive account', async () => {
      const hashedPassword = await bcrypt.hash('Test123', 10);
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'inactivo', // Inactive account
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactiva');
    });

    it('should update ultimo_login on successful login', async () => {
      const hashedPassword = await bcrypt.hash('Test123', 10);
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
        perfiles_gamer: {},
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usuarios.update.mockResolvedValue(mockUser);
      mockRedis.setex.mockResolvedValue('OK');

      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123',
        });

      expect(mockPrisma.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            ultimo_login: expect.any(Date),
          }),
        })
      );
    });
  });
});
