import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { mockPrisma } from './setup';
import { generateAccessToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

// Import setup to initialize mocks
import './setup';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate with valid token', async () => {
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

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with expired token', async () => {
      // Generate token that expires immediately
      const expiredToken = jwt.sign(
        {
          userId: 'user-123',
          username: 'testuser',
          rol: 'estudiante',
        },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } // Expires immediately
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      // Wait a bit to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 100));

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail if user not found in database', async () => {
      const token = generateAccessToken({
        userId: 'non-existent-user',
        username: 'ghost',
        rol: 'estudiante',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autorizado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        rol: 'estudiante',
        estado: 'inactivo', // Inactive user
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

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.usuarios.findUnique.mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autorizado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with token signed with wrong secret', async () => {
      const fakeToken = jwt.sign(
        {
          userId: 'user-123',
          username: 'testuser',
          rol: 'estudiante',
        },
        'wrong-secret',
        { expiresIn: '15m' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${fakeToken}`,
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access with correct role', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'admin',
        rol: 'admin',
        email: 'admin@example.com',
        nombre: 'Admin',
        apellido: 'User',
        password_hash: 'hash',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const middleware = authorize('admin', 'profesor');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access with incorrect role', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'student',
        rol: 'estudiante',
        email: 'student@example.com',
        nombre: 'Student',
        apellido: 'User',
        password_hash: 'hash',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const middleware = authorize('admin', 'profesor');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access without authenticated user', () => {
      mockRequest.user = undefined;

      const middleware = authorize('admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autenticado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow profesor role', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'teacher',
        rol: 'profesor',
        email: 'teacher@example.com',
        nombre: 'Teacher',
        apellido: 'User',
        password_hash: 'hash',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const middleware = authorize('profesor', 'admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow estudiante role when specified', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'student',
        rol: 'estudiante',
        email: 'student@example.com',
        nombre: 'Student',
        apellido: 'User',
        password_hash: 'hash',
        estado: 'activo',
        avatar_url: null,
        fecha_nacimiento: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
        ultimo_login: null,
      };

      const middleware = authorize('estudiante');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
