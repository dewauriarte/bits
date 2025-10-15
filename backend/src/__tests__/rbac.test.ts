import request from 'supertest';
import express from 'express';
import { mockPrisma } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { authenticate, authorize } from '../middlewares/auth.middleware';

// Import setup to initialize mocks
import './setup';

const app = express();
app.use(express.json());

// Mock protected routes for different roles
app.get('/api/admin-only', authenticate, authorize('admin'), (_req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

app.get('/api/profesor-only', authenticate, authorize('profesor'), (_req, res) => {
  res.json({ success: true, message: 'Profesor access granted' });
});

app.get('/api/admin-profesor', authenticate, authorize('admin', 'profesor'), (_req, res) => {
  res.json({ success: true, message: 'Admin or Profesor access granted' });
});

app.get('/api/estudiante-only', authenticate, authorize('estudiante'), (_req, res) => {
  res.json({ success: true, message: 'Estudiante access granted' });
});

app.get('/api/all-roles', authenticate, authorize('admin', 'profesor', 'estudiante'), (_req, res) => {
  res.json({ success: true, message: 'All roles access granted' });
});

describe('RBAC - Role Based Access Control', () => {
  const adminUser = {
    id: 'admin-123',
    username: 'admin',
    email: 'admin@example.com',
    rol: 'admin',
    estado: 'activo',
    nombre: 'Admin',
    apellido: 'User',
    password_hash: 'hash',
    avatar_url: null,
    fecha_nacimiento: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
    ultimo_login: null,
  };

  const profesorUser = {
    id: 'profesor-123',
    username: 'profesor',
    email: 'profesor@example.com',
    rol: 'profesor',
    estado: 'activo',
    nombre: 'Profesor',
    apellido: 'User',
    password_hash: 'hash',
    avatar_url: null,
    fecha_nacimiento: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
    ultimo_login: null,
  };

  const estudianteUser = {
    id: 'estudiante-123',
    username: 'estudiante',
    email: 'estudiante@example.com',
    rol: 'estudiante',
    estado: 'activo',
    nombre: 'Estudiante',
    apellido: 'User',
    password_hash: 'hash',
    avatar_url: null,
    fecha_nacimiento: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
    ultimo_login: null,
  };

  describe('Admin Role', () => {
    const adminToken = generateAccessToken({
      userId: adminUser.id,
      username: adminUser.username,
      rol: adminUser.rol,
    });

    beforeEach(() => {
      mockPrisma.usuarios.findUnique.mockResolvedValue(adminUser);
    });

    it('should access admin-only routes', async () => {
      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should access admin-profesor routes', async () => {
      const response = await request(app)
        .get('/api/admin-profesor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should access all-roles routes', async () => {
      const response = await request(app)
        .get('/api/all-roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should NOT access profesor-only routes (even as admin)', async () => {
      const response = await request(app)
        .get('/api/profesor-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No tienes permisos');
    });

    it('should NOT access estudiante-only routes', async () => {
      const response = await request(app)
        .get('/api/estudiante-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Profesor Role', () => {
    const profesorToken = generateAccessToken({
      userId: profesorUser.id,
      username: profesorUser.username,
      rol: profesorUser.rol,
    });

    beforeEach(() => {
      mockPrisma.usuarios.findUnique.mockResolvedValue(profesorUser);
    });

    it('should access profesor-only routes', async () => {
      const response = await request(app)
        .get('/api/profesor-only')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profesor access granted');
    });

    it('should access admin-profesor routes', async () => {
      const response = await request(app)
        .get('/api/admin-profesor')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should access all-roles routes', async () => {
      const response = await request(app)
        .get('/api/all-roles')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should NOT access admin-only routes', async () => {
      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No tienes permisos');
    });

    it('should NOT access estudiante-only routes', async () => {
      const response = await request(app)
        .get('/api/estudiante-only')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Estudiante Role', () => {
    const estudianteToken = generateAccessToken({
      userId: estudianteUser.id,
      username: estudianteUser.username,
      rol: estudianteUser.rol,
    });

    beforeEach(() => {
      mockPrisma.usuarios.findUnique.mockResolvedValue(estudianteUser);
    });

    it('should access estudiante-only routes', async () => {
      const response = await request(app)
        .get('/api/estudiante-only')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Estudiante access granted');
    });

    it('should access all-roles routes', async () => {
      const response = await request(app)
        .get('/api/all-roles')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should NOT access admin-only routes (read-only restriction)', async () => {
      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No tienes permisos');
    });

    it('should NOT access profesor-only routes', async () => {
      const response = await request(app)
        .get('/api/profesor-only')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should NOT access admin-profesor routes', async () => {
      const response = await request(app)
        .get('/api/admin-profesor')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('No Authentication', () => {
    it('should NOT access any protected route without token', async () => {
      const response = await request(app).get('/api/all-roles');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token no proporcionado');
    });

    it('should NOT access admin routes without token', async () => {
      const response = await request(app).get('/api/admin-only');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should NOT access profesor routes without token', async () => {
      const response = await request(app).get('/api/profesor-only');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should NOT access estudiante routes without token', async () => {
      const response = await request(app).get('/api/estudiante-only');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Role Validation Edge Cases', () => {
    it('should handle case-sensitive role comparison', async () => {
      const userWithUppercaseRole = {
        ...estudianteUser,
        rol: 'ESTUDIANTE', // Uppercase role
      };

      const token = generateAccessToken({
        userId: userWithUppercaseRole.id,
        username: userWithUppercaseRole.username,
        rol: userWithUppercaseRole.rol,
      });

      mockPrisma.usuarios.findUnique.mockResolvedValue(userWithUppercaseRole);

      const response = await request(app)
        .get('/api/estudiante-only')
        .set('Authorization', `Bearer ${token}`);

      // Should fail because roles are case-sensitive
      expect(response.status).toBe(403);
    });

    it('should reject access with modified token role', async () => {
      // Student tries to access admin route
      const estudianteToken = generateAccessToken({
        userId: estudianteUser.id,
        username: estudianteUser.username,
        rol: estudianteUser.rol,
      });

      // Even if somehow they modify the token claim (which they can't without the secret),
      // the database check should prevent access
      mockPrisma.usuarios.findUnique.mockResolvedValue(estudianteUser);

      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${estudianteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
