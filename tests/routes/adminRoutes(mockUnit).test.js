// __tests__/routes.test.js
const express = require('express');
const request = require('supertest');

// Mock models
jest.mock('../../models/User');
jest.mock('../../models/Idea');

const User = require('../../models/User');
const Idea = require('../../models/Idea');

// Bring in your router
const adminRoutes = require('../../routes/adminRoutes');

// A helper to build an app with auth middleware injected
function createApp(user) {
  const app = express();
  // fake auth: attach req.user
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use(express.json());
  app.use('/', adminRoutes);
  return app;
}

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /users', () => {
    it('should return list of users without passwords', async () => {
      const fakeUsers = [
        { _id: '1', username: 'user1', email: 'user1@example.com' },
        { _id: '2', username: 'user2', email: 'user2@example.com' },
      ];
      
      // Create proper chain of mocks
      const mockSelect = jest.fn().mockResolvedValue(fakeUsers);
      User.find = jest.fn().mockReturnValue({
        select: mockSelect
      });
      
      const app = createApp({ email: 'tarek@gmail.com' });
      
      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(User.find).toHaveBeenCalled();
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(res.body.users).toEqual(fakeUsers);
    });

    it('should handle DB errors', async () => {
      const selectMock = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });
      
      User.find = jest.fn().mockReturnValue({
        select: selectMock
      });

      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).get('/users');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Error fetching users/);
    });
  });

  describe('GET /ideas', () => {
    it('should return list of ideas', async () => {
      const fakeIdeas = [
        { _id: 'i1', username: 'user1', description: 'Idea1' },
        { _id: 'i2', username: 'user2', description: 'Idea2' },
      ];
      
      Idea.find = jest.fn().mockResolvedValue(fakeIdeas);

      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).get('/ideas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ideas).toEqual(fakeIdeas);
    });

    it('should handle DB errors', async () => {
      Idea.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).get('/ideas');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Error fetching ideas/);
    });
  });

  describe('DELETE /users/:id', () => {
    const someUser = { _id: 'u1', email: 'someone@example.com' };

    it('should deny non-admin', async () => {
      const app = createApp({ email: 'notadmin@example.com' });
      const res = await request(app).delete('/users/u1');
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Access denied/);
    });

    it('should 404 if user not found', async () => {
      User.findById = jest.fn().mockImplementation(() => {
        return null;
      });
      
      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).delete('/users/u1');
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/User not found/);
    });

    it('should delete normal user', async () => {
      User.findById = jest.fn().mockReturnValue(someUser);
      User.findByIdAndDelete = jest.fn().mockReturnValue(someUser);
      
      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).delete('/users/u1');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted successfully/);
    });
  });

  describe('DELETE /ideas/:id', () => {
    const someIdea = { _id: 'i1', description: 'Test idea' };

    it('should delete idea', async () => {
      Idea.findById = jest.fn().mockReturnValue(someIdea);
      Idea.findByIdAndDelete = jest.fn().mockReturnValue(someIdea);
      
      const app = createApp({ email: 'tarek@gmail.com' });
      const res = await request(app).delete('/ideas/i1');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted successfully/);
    });
  });
});
 