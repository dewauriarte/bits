import { jest } from '@jest/globals';

// Mock Prisma Client
export const mockPrisma: any = {
  usuarios: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  perfiles_gamer: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock Redis
export const mockRedis: any = {
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

// Mock Prisma module
jest.mock('../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock Redis module
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: mockRedis,
}));

// Setup environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
