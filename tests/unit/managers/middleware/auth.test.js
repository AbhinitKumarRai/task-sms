require('../../mocks/app.mock');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../../app');
const { roles } = require('../../../../managers/entities/_common/roles');

describe('Authentication Middleware', () => {
  describe('Token Validation', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/school/getAll');
      
      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', 'InvalidToken');
      
      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Invalid token format');
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = global.generateAuthToken(roles.SUPER_ADMIN, null, '-1h');
      
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Token expired');
    });

    it('should reject requests with malformed token', async () => {
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', 'Bearer malformed.token.here');
      
      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Role Authorization', () => {
    it('should reject access to super admin routes for regular admin', async () => {
      const adminToken = global.generateAuthToken(roles.ADMIN);
      
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should allow super admin access to all routes', async () => {
      const superAdminToken = global.generateAuthToken(roles.SUPER_ADMIN);
      
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });
}); 