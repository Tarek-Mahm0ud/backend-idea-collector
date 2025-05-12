const request = require('supertest');
const express = require('express');
const cors = require('cors');
const ideaRoutes = require('../../routes/ideaRoutes');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

let app;
let authToken;

beforeAll(() => {
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/ideas', ideaRoutes);
});

describe('Idea Routes', () => {
  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'TestPass123'
    });

    authToken = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/ideas', () => {
    it('should create a new idea with valid data', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test idea description'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('description', 'Test idea description');
      expect(res.body.data).toHaveProperty('email', 'testuser@example.com');
    });

    it('should return validation error for empty description', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: ''
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return error without authentication token', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .send({
          description: 'Test idea description'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Please authenticate');
    });

    it('should return error if user token does not have email', async () => {
      const badToken = jwt.sign(
        { id: 'fakeid', username: 'testuser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    
      const res = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${badToken}`)
        .send({
          description: 'Test idea with bad token'
        });
    
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid user data in token');
    });

    it('should return error with invalid token', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          description: 'Test idea description'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Please authenticate');
    });

  });
});