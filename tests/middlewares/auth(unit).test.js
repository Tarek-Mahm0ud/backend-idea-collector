const jwt = require('jsonwebtoken');
const auth = require('../../middlewares/auth');

describe('Auth Middleware Test', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should pass with valid token', async () => {
      const token = jwt.sign(
        { email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.email).toBe('test@example.com');
    });

    it('should fail with invalid token', async () => {
      mockReq.header.mockReturnValue('Bearer invalid-token');

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please authenticate'
      });
    });

    it('should fail with missing token', async () => {
      mockReq.header.mockReturnValue(undefined);

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please authenticate'
      });
    });

    it('should fail with malformed token format', async () => {
      mockReq.header.mockReturnValue('InvalidFormat token');

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please authenticate'
      });
    });
  });

  describe('Token Expiration', () => {
    it('should fail with expired token', async () => {
      const token = jwt.sign(
        { email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please authenticate'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle token verification errors', async () => {
      mockReq.header.mockImplementation(() => {
        throw new Error('Header error');
      });

      await auth(mockReq, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please authenticate'
      });
    });
  });
});