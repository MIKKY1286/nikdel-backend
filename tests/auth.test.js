import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';

describe('Auth Endpoints', () => {
  const validUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '1234567890',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('should not register a user with an existing email', async () => {
      // Create the user first
      await User.create(validUser);

      // Attempt to register again
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Ensure the user exists before login tests
      await User.create(validUser);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: 'wrongpassword',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail login with unregistered email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
