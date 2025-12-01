import { vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },
  account: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  verificationToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  job: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  jobAssignment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  xPAudit: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  moneyTx: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  systemLog: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  // Add other models as needed
  $transaction: vi.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma)
    }
    return Promise.resolve(callback)
  }),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}

// Mock the prisma module
vi.mock('@/app/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}))

// Mock generated client
vi.mock('@/app/lib/generated', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  UserRole: {
    OPERATOR: 'OPERATOR',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
  },
  JobStatus: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
  },
  JobAssignmentStatus: {
    APPLIED: 'APPLIED',
    APPROVED: 'APPROVED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
  },
  MoneyTxType: {
    EARNED: 'EARNED',
    SPENT: 'SPENT',
    REFUND: 'REFUND',
  },
  ItemRarity: {
    COMMON: 'COMMON',
    UNCOMMON: 'UNCOMMON',
    RARE: 'RARE',
    EPIC: 'EPIC',
    LEGENDARY: 'LEGENDARY',
  },
  ItemType: {
    COSMETIC: 'COSMETIC',
    BOOST: 'BOOST',
    COLLECTIBLE: 'COLLECTIBLE',
  },
  LogLevel: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
  },
}))

export const resetAllMocks = () => {
  vi.clearAllMocks()
}

export { mockPrisma }

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Bakalari
vi.mock('@/app/lib/bakalari', () => ({
  loginToBakalariAndFetchUserData: vi.fn(),
}))

export const createMockRequest = (method: string, url: string, body?: any) => {
  const req = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
  return req
}

export const mockSessions = {
  student: {
    user: {
      id: 'student1',
      name: 'Student User',
      email: 'student@example.com',
      role: 'STUDENT',
    },
  },
  teacher: {
    user: {
      id: 'teacher1',
      name: 'Teacher User',
      email: 'teacher@example.com',
      role: 'TEACHER',
    },
  },
  operator: {
    user: {
      id: 'operator1',
      name: 'Operator User',
      email: 'operator@example.com',
      role: 'OPERATOR',
    },
  },
}

export const mockRequireTeacher = vi.fn()
export const mockRequireStudent = vi.fn()
export const mockRequireOperator = vi.fn()
export const mockBakalariClient = vi.fn()
