import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';

jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
  db: null,
}));

import { auth } from '../config/firebase';
const mockVerifyIdToken = auth.verifyIdToken as jest.Mock;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authMiddleware', () => {
  it('calls next(AppError 401) when no token provided', async () => {
    const req = { headers: {} } as Request;
    await authMiddleware(req as any, mockRes(), mockNext);
    const err = mockNext.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('No token provided');
  });

  it('calls next(AppError 401) when token is invalid', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Token expired'));
    const req = { headers: { authorization: 'Bearer bad-token' } } as Request;
    await authMiddleware(req as any, mockRes(), mockNext);
    const err = mockNext.mock.calls[0][0] as unknown as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid token');
  });

  it('attaches user to req and calls next() on valid token', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'user-123', email: 'test@example.com' });
    const req = { headers: { authorization: 'Bearer valid-token' } } as Request;
    await authMiddleware(req as any, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect((req as any).user).toEqual({ uid: 'user-123', email: 'test@example.com' });
  });

  it('strips Bearer prefix correctly from authorization header', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'u1', email: 'a@b.com' });
    const req = { headers: { authorization: 'Bearer my-token-value' } } as Request;
    await authMiddleware(req as any, mockRes(), mockNext);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('my-token-value');
  });
});

describe('requireRole', () => {
  it('calls next(AppError 401) when req.user is missing', async () => {
    const req = { user: undefined } as any;
    const middleware = requireRole(['admin']);
    await middleware(req, mockRes(), mockNext);
    const err = mockNext.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next(AppError 403) when user role is not in allowed list', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: () => ({ role: 'user' }) }),
        }),
      }),
    };
    const req = { user: { uid: 'u1', email: 'x@y.com' }, app: { get: jest.fn().mockReturnValue(mockDb) } } as any;
    const middleware = requireRole(['admin']);
    await middleware(req, mockRes(), mockNext);
    const err = mockNext.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
  });

  it('attaches role to req.user and calls next() for allowed role', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: () => ({ role: 'admin' }) }),
        }),
      }),
    };
    const req = { user: { uid: 'u1', email: 'admin@test.com' }, app: { get: jest.fn().mockReturnValue(mockDb) } } as any;
    const middleware = requireRole(['admin']);
    await middleware(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect(req.user.role).toBe('admin');
  });
});